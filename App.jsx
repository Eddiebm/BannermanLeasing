import { useState, useEffect, useCallback, useRef } from "react";
import { generateContent } from "./bannerman-cm-api.js";
import { CONTENT_TYPES, LLM_PROVIDERS, PLATFORM_CONFIG, WEEKLY_TOPICS } from "./bannerman-cm-config.js";
import ContentDisplay from "./bannerman-cm-content-display.jsx";
import { buildQueue, loadState, saveState } from "./bannerman-cm-queue.js";
import { globalStyles, styles } from "./bannerman-cm-styles.js";

/**
 * @typedef {Object} LogEntry
 * @property {string} msg
 * @property {"info"|"success"|"error"} type
 * @property {string} ts
 */

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("bann_key") || "");
  const [keyInput, setKeyInput] = useState(() => sessionStorage.getItem("bann_key") || "");
  const [llmProvider, setLlmProvider] = useState(() => sessionStorage.getItem("bann_llm_provider") || "anthropic");
  const [llmModel, setLlmModel] = useState(() => sessionStorage.getItem("bann_llm_model") || "");
  const [queue, setQueue] = useState([]);
  const [view, setView] = useState("dashboard"); // dashboard | queue | generate | content | settings
  const [selectedTask, setSelectedTask] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [log, setLog] = useState([]);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWeek, setFilterWeek] = useState("all");
  const [stats, setStats] = useState({ total:0, pending:0, ready:0, approved:0, posted:0, failed:0 });
  const [batchSize, setBatchSize] = useState(7);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchRunningRef = useRef(false);
  /** @type {{ current: LogEntry[] }} */
  const logRef = useRef([]);
  const currentYear = new Date().getFullYear();

  // Init
  useEffect(() => {
    const saved = loadState();
    const q = saved?.queue || buildQueue();
    setQueue(q);
    recalcStats(q);
  }, []);

  const recalcStats = (q) => {
    setStats({
      total: q.length,
      pending: q.filter(t=>t.status==="pending").length,
      ready: q.filter(t=>t.status==="ready").length,
      approved: q.filter(t=>t.status==="approved").length,
      posted: q.filter(t=>t.status==="posted").length,
      failed: q.filter(t=>t.status==="failed").length,
    });
  };

  const addLog = useCallback((msg, type="info") => {
    const entry = { msg, type, ts: new Date().toLocaleTimeString() };
    logRef.current = [entry, ...logRef.current].slice(0, 100);
    setLog([...logRef.current]);
  }, []);

  const updateTask = useCallback((id, updates) => {
    setQueue(prev => {
      const next = prev.map(t => t.id===id ? {...t, ...updates} : t);
      saveState({ queue: next });
      recalcStats(next);
      return next;
    });
  }, []);

  const saveKey = () => {
    sessionStorage.setItem("bann_key", keyInput);
    setApiKey(keyInput);
    addLog("API key saved ✓", "success");
  };

  // ── Generate single task (with one retry after 2s on failure) ───────────────
  const generateTask = async (task, attempt = 1) => {
    setGeneratingId(task.id);
    updateTask(task.id, { status:"generating" });
    addLog(`Generating ${task.platform} ${task.contentType} (Week ${task.week})…`);
    try {
      const content = await generateContent(apiKey, task, { provider: llmProvider, model: llmModel || undefined });
      updateTask(task.id, { status:"ready", content, generatedAt: new Date().toISOString() });
      addLog(`✓ ${task.platform} Week ${task.week} ready`, "success");
    } catch(e) {
      if (attempt < 2) {
        addLog(`Retrying in 2s…`, "info");
        await new Promise(r => setTimeout(r, 2000));
        return generateTask(task, attempt + 1);
      }
      // Sanitize potential error messages to prevent leakage of sensitive information
      let errorMessage = "Unknown error";
      if (e instanceof Error) {
        // Broadly categorize or remove specific sensitive terms if suspected
        if (e.message.includes("Supabase service role key")) {
            errorMessage = "A server-side configuration error occurred.";
        } else {
            errorMessage = e.message.substring(0, 200); // Truncate long messages
        }
      } else if (typeof e === 'string') {
        if (e.includes("Supabase service role key")) {
            errorMessage = "A server-side configuration error occurred.";
        } else {
            errorMessage = e.substring(0, 200); // Truncate long messages
        }
      }
      updateTask(task.id, { status:"failed", error: errorMessage });
      addLog(`✗ ${task.platform} Week ${task.week}: ${errorMessage}`, "error");
    }
    setGeneratingId(null);
  };

  // ── Batch generate ─────────────────────────────────────────────────────────
  const batchGenerate = async () => {
    batchRunningRef.current = true;
    setBatchRunning(true);
    const pending = queue.filter(t=>t.status==="pending").slice(0, batchSize);
    if (pending.length === 0) {
      addLog("No pending tasks to generate.");
      batchRunningRef.current = false;
      setBatchRunning(false);
      return;
    }
    let stopRequested = false;
    addLog(`Starting batch: ${pending.length} tasks…`);
    for (const task of pending) {
      if (!batchRunningRef.current) {
        stopRequested = true;
        break;
      }
      await generateTask(task);
      await new Promise(r => setTimeout(r, 800)); // rate limit buffer
    }
    batchRunningRef.current = false;
    setBatchRunning(false);
    addLog(stopRequested ? "Batch stopped" : "Batch complete", stopRequested ? "info" : "success");
  };

  // ── Mark approved / posted ─────────────────────────────────────────────────
  const markApproved = (id) => {
    updateTask(id, { status:"approved" });
    addLog(`Marked as approved`, "success");
  };
  const markPosted = (id) => {
    updateTask(id, { status:"posted", postedAt: new Date().toISOString() });
    addLog(`Marked as posted`, "success");
  };

  // ── Export queue or ready content as JSON download ─────────────────────────
  const exportQueue = (kind) => {
    const data = kind === "ready" ? queue.filter(t => t.status === "ready" || t.status === "approved" || t.status === "posted") : queue;
    const blob = new Blob([JSON.stringify({ exported: data.length, at: new Date().toISOString(), tasks: data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bannerman-cm-${kind}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    addLog(`Exported ${data.length} tasks (${kind})`, "success");
  };

  // ── Filtered queue ─────────────────────────────────────────────────────────
  const filteredQueue = queue.filter(t => {
    if (filterPlatform !== "all" && t.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterWeek !== "all" && t.week !== parseInt(filterWeek)) return false;
    return true;
  });

  const todayStr = new Date().toISOString().slice(0,10);
  const todayTasks = queue.filter(t => t.date === todayStr);
  const tomorrowStr = new Date(Date.now()+86400000).toISOString().slice(0,10);
  const tomorrowTasks = queue.filter(t => t.date === tomorrowStr);
  const readyTasks = queue.filter(t => t.status==="ready" || t.status==="approved" || t.status==="posted");

  // ── STATUS COLORS ──────────────────────────────────────────────────────────
  const statusColor = { pending:"#4A5568", generating:"#E07B2A", ready:"#22C55E", approved:"#8B5CF6", posted:"#3B82F6", failed:"#EF4444" };
  const statusDot = (s) => <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:statusColor[s]||"#666",marginRight:6,flexShrink:0}} />;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  const S = styles;

  return (
    <div style={S.root}>
      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoMark}>BL</div>
          <div>
            <div style={S.logoName}>Bannerman</div>
            <div style={S.logoSub}>Content Machine</div>
          </div>
        </div>

        <nav style={S.nav}>
          {[
            ["dashboard","⬛","Dashboard"],
            ["queue","📋","Queue"],
            ["generate","⚡","Generate"],
            ["content","📄","Content"],
            ["settings","⚙","Settings"],
          ].map(([v,icon,label]) => (
            <button key={v} onClick={()=>setView(v)} style={{...S.navBtn, ...(view===v?S.navBtnActive:{})}} aria-label={label} aria-current={view===v ? "page" : undefined}>
              <span style={{fontSize:16,marginRight:10}} aria-hidden>{icon}</span>{label}
              {v==="generate" && stats.pending>0 && <span style={S.navBadge}>{stats.pending}</span>}
              {v==="content" && stats.ready>0 && <span style={{...S.navBadge,background:"#22C55E"}}>{stats.ready}</span>}
            </button>
          ))}
        </nav>

        <div style={S.sidebarStats}>
          {[["Total",stats.total,"#7A8899"],["Ready",stats.ready,"#22C55E"],["Approved",stats.approved,"#8B5CF6"],["Posted",stats.posted,"#3B82F6"],["Pending",stats.pending,"#E07B2A"]].map(([label,val,color])=>(
            <div key={label} style={S.sidebarStat}>
              <div style={{...S.sidebarStatNum,color}}>{val}</div>
              <div style={S.sidebarStatLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div style={S.apiStatus}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:apiKey?"#22C55E":"#EF4444"}} />
            <span style={{fontSize:11,color:apiKey?"#22C55E":"#EF4444",fontFamily:"monospace"}}>
              {apiKey ? "Client Token Set" : "No Client Token"}
            </span>
          </div>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main style={S.main}>

        {/* ══ DASHBOARD ═══════════════════════════════════════════════════ */}
        {view==="dashboard" && (
          <div style={S.page}>
            <div style={S.pageHeader}>
              <h1 style={S.pageTitle}>Command Center</h1>
              <div style={S.pageDate}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
            </div>

            {/* Big stats */}
            <div style={S.statGrid}>
              {[
                {label:"Year Progress",val:`${Math.round((new Date()-new Date(currentYear,0,1))/(365*86400000)*100)}%`,sub:`of ${currentYear} complete`,color:"#E07B2A"},
                {label:"Content Ready",val:stats.ready,sub:"posts generated",color:"#22C55E"},
                {label:"Posted",val:stats.posted,sub:"live on platforms",color:"#3B82F6"},
                {label:"Queue",val:stats.pending,sub:"tasks pending generation",color:"#9B6FD4"},
              ].map(s=>(
                <div key={s.label} style={S.statCard}>
                  <div style={{fontSize:36,fontWeight:900,color:s.color,fontFamily:"monospace",lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:11,color:"#7A8899",marginTop:4,fontFamily:"monospace"}}>{s.label}</div>
                  <div style={{fontSize:11,color:"#4A5568",marginTop:2}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Today's tasks */}
            <div style={S.section}>
              <div style={S.sectionHeader}>
                <h2 style={S.sectionTitle}>Today — {todayStr}</h2>
                <span style={S.sectionCount}>{todayTasks.length} tasks</span>
              </div>
              {todayTasks.length === 0 ? <div style={S.empty}>No tasks scheduled for today</div> : (
                <div style={S.taskList}>
                  {todayTasks.map(t=>(
                    <div key={t.id} style={S.taskRow} onClick={()=>{setSelectedTask(t);setView("content")}}>
                      <span style={{fontSize:18}}>{PLATFORM_CONFIG[t.platform]?.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {statusDot(t.status)}
                          <span style={S.taskName}>{CONTENT_TYPES[t.contentType]?.label || t.contentType}</span>
                          <span style={{...S.chip,background:PLATFORM_CONFIG[t.platform]?.color+"22",color:PLATFORM_CONFIG[t.platform]?.color}}>{t.platform}</span>
                        </div>
                        <div style={S.taskSub}>Week {t.week} · {new Date(t.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} · {WEEKLY_TOPICS[Math.min(t.week-1,51)][t.platform==="blog"&&t.contentType==="blog_post_b"?"blogB":"blogA"]?.slice(0,60)}…</div>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {t.status==="pending" && <button style={S.btnSm} onClick={e=>{e.stopPropagation();generateTask(t)}} disabled={!!generatingId}>
                          {generatingId===t.id?"⏳":"⚡"} Generate
                        </button>}
                        {t.status==="ready" && <><button style={S.btnSm} onClick={e=>{e.stopPropagation();markApproved(t.id)}} aria-label="Mark approved">✓ Approve</button><button style={{...S.btnSm,...S.btnGreen}} onClick={e=>{e.stopPropagation();markPosted(t.id)}} aria-label="Mark as posted">✓ Posted</button></>}
                        {t.status==="approved" && <button style={{...S.btnSm,...S.btnGreen}} onClick={e=>{e.stopPropagation();markPosted(t.id)}} aria-label="Mark as posted">✓ Mark Posted</button>}
                        {t.status==="failed" && <button style={{...S.btnSm,...S.btnRed}} onClick={e=>{e.stopPropagation();generateTask(t)}}>↺ Retry</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tomorrow preview */}
            <div style={S.section}>
              <div style={S.sectionHeader}>
                <h2 style={S.sectionTitle}>Tomorrow</h2>
                <span style={S.sectionCount}>{tomorrowTasks.length} tasks</span>
              </div>
              <div style={S.taskList}>
                {tomorrowTasks.slice(0,4).map(t=>(
                  <div key={t.id} style={{...S.taskRow,opacity:0.7}}>
                    <span style={{fontSize:16}}>{PLATFORM_CONFIG[t.platform]?.icon}</span>
                    <div style={{flex:1}}>
                      <span style={S.taskName}>{CONTENT_TYPES[t.contentType]?.label}</span>
                      <span style={{...S.chip,marginLeft:8,background:PLATFORM_CONFIG[t.platform]?.color+"22",color:PLATFORM_CONFIG[t.platform]?.color}}>{t.platform}</span>
                    </div>
                    <div style={{...S.chip,...(t.status==="ready"||t.status==="approved"?{background:(t.status==="approved"?"#8B5CF6":"#22C55E")+"22",color:t.status==="approved"?"#8B5CF6":"#22C55E"}:{background:"#E07B2A22",color:"#E07B2A"})}}>
                      {t.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity log */}
            <div style={S.section}>
              <div style={S.sectionHeader}>
                <h2 style={S.sectionTitle}>Activity Log</h2>
                <button style={S.btnSm} onClick={()=>setLog([])}>Clear</button>
              </div>
              <div style={{background:"#0D1117",borderRadius:8,padding:12,maxHeight:200,overflowY:"auto",fontFamily:"monospace",fontSize:12}}>
                {log.length===0 && <span style={{color:"#4A5568"}}>No activity yet…</span>}
                {log.map((l,i)=>(
                  <div key={i} style={{color:l.type==="error"?"#EF4444":l.type==="success"?"#22C55E":"#7A8899",marginBottom:3}}>
                    <span style={{color:"#4A5568"}}>{l.ts} </span>{l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ QUEUE ════════════════════════════════════════════════════════ */}
        {view==="queue" && (
          <div style={S.page}>
            <div style={S.pageHeader}>
              <h1 style={S.pageTitle}>365-Day Queue</h1>
              <div style={S.pageDate}>{filteredQueue.length} tasks shown</div>
            </div>

            {/* Filters */}
            <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
              {[["Platform","all","filterPlatform",setFilterPlatform,["all",...Object.keys(PLATFORM_CONFIG)]],
                ["Status","all","filterStatus",setFilterStatus,["all","pending","generating","ready","approved","posted","failed"]],
              ].map(([label,def,key,setter,opts])=>(
                <select key={key} style={S.select} value={key==="filterPlatform"?filterPlatform:filterStatus} onChange={e=>setter(e.target.value)}>
                  {opts.map(o=><option key={o} value={o}>{o==="all"?`All ${label}s`:o}</option>)}
                </select>
              ))}
              <select style={S.select} value={filterWeek} onChange={e=>setFilterWeek(e.target.value)}>
                <option value="all">All Weeks</option>
                {Array.from({length:52},(_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}
              </select>
            </div>

            <div style={S.taskList}>
              {filteredQueue.slice(0,200).map(t=>(
                <div key={t.id} style={{...S.taskRow, cursor:"pointer"}} onClick={()=>{setSelectedTask(t);setView("content")}}>
                  <span style={{fontSize:16,width:24,textAlign:"center"}}>{PLATFORM_CONFIG[t.platform]?.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      {statusDot(t.status)}
                      <span style={S.taskName}>{CONTENT_TYPES[t.contentType]?.label}</span>
                      <span style={{...S.chip,background:PLATFORM_CONFIG[t.platform]?.color+"22",color:PLATFORM_CONFIG[t.platform]?.color,fontSize:10}}>{t.platform}</span>
                      <span style={{...S.chip,background:"#252D3D",color:"#7A8899",fontSize:10}>W{t.week}</span>
                    </div>
                    <div style={S.taskSub}>{t.date} · {WEEKLY_TOPICS[Math.min(t.week-1,51)].blogA.slice(0,50)}…</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{...S.chip,background:statusColor[t.status]+"22",color:statusColor[t.status]}}>{t.status}</span>
                    {t.status==="pending" && <button style={S.btnSm} onClick={e=>{e.stopPropagation();generateTask(t)}} disabled={!!generatingId}>{generatingId===t.id?"⏳":"⚡"}</button>}
                    {t.status==="ready" && <><button style={S.btnSm} onClick={e=>{e.stopPropagation();markApproved(t.id)}} aria-label="Approve">Approve</button><button style={{...S.btnSm,...S.btnGreen}} onClick={e=>{e.stopPropagation();markPosted(t.id)}} aria-label="Mark posted">✓</button></>}
                    {t.status==="approved" && <button style={{...S.btnSm,...S.btnGreen}} onClick={e=>{e.stopPropagation();markPosted(t.id)}} aria-label="Mark posted">✓</button>}
                  </div>
                </div>
              ))}
              {filteredQueue.length > 200 && <div style={{...S.empty,padding:16}}>Showing first 200 of {filteredQueue.length} — use filters to narrow</div>}
            </div>
          </div>
        )}

        {/* ══ GENERATE ═════════════════════════════════════════════════════ */}
        {view==="generate" && (
          <div style={S.page}>
            <div style={S.pageHeader}>
              <h1 style={S.pageTitle}>Generate Content</h1>
            </div>

            {/* Batch generator */}
            <div style={S.card}>
              <h3 style={S.cardTitle}>⚡ Batch Generator</h3>
              <p style={{color:"#7A8899",fontSize:13,marginBottom:16,lineHeight:1.6}}>
                Generates multiple pending tasks in sequence. Recommended: start with 3–5 at a time to verify output quality, then scale up.
              </p>
              <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <label style={{color:"#7A8899",fontSize:13,fontFamily:"monospace"}}>Batch size:</label>
                  <select style={{...S.select,width:80}} value={batchSize} onChange={e=>setBatchSize(parseInt(e.target.value))}>
                    {[1,3,5,7,10,14,21].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{color:"#7A8899",fontSize:12,fontFamily:"monospace"}}>{stats.pending} pending tasks</div>
                <button style={{...S.btn,...(batchRunning?S.btnDisabled:{})}} onClick={batchGenerate} disabled={batchRunning}>
                  {batchRunning ? "⏳ Generating…" : `⚡ Generate Next ${batchSize}`}
                </button>
                {batchRunning && <button style={{...S.btnSm,...S.btnRed}} onClick={() => { batchRunningRef.current = false; setBatchRunning(false); addLog("Stopping batch after current task…"); }}>■ Stop</button>}
              </div>
            </div>

            {/* Platform breakdown */}
            <div style={S.card}>
              <h3 style={S.cardTitle}>Platform Status</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
                {Object.entries(PLATFORM_CONFIG).map(([key,cfg])=>{
                  const ptasks = queue.filter(t=>t.platform===key);
                  const pready = ptasks.filter(t=>t.status==="ready").length;
                  const pposted = ptasks.filter(t=>t.status==="posted").length;
                  const ppend = ptasks.filter(t=>t.status==="pending").length;
                  return (
                    <div key={key} style={{background:"#1C2130",border:"1px solid #252D3D",borderRadius:8,padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                        <span style={{fontSize:20}}>{cfg.icon}</span>
                        <span style={{fontWeight:700,color:"#F0F4F8",fontSize:13}}>{cfg.label}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                        {[["Ready",pready,"#22C55E"],["Posted",pposted,"#3B82F6"],["Pending",ppend,"#E07B2A"],["Total",ptasks.length,"#7A8899"]].map(([l,v,c])=>(
                          <div key={l}>
                            <div style={{fontSize:18,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
                            <div style={{fontSize:10,color:"#4A5568",fontFamily:"monospace"}}>{l}</div>
                          </div>
                        ))}
                      </div>
                      {!cfg.canAutoPost && <div style={{marginTop:10,fontSize:10,color:"#E07B2A",fontFamily:"monospace",background:"#E07B2A11",padding:"3px 6px",borderRadius:3}}>Manual post required</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Week generator */}
            <div style={S.card}>
              <h3 style={S.cardTitle}>This Week's Topics (Week {Math.min(Math.floor((new Date()-new Date(new Date().getFullYear(),0,1))/604800000)+1,52)})</h3>
              {(() => {
                const w = Math.min(Math.floor((new Date()-new Date(new Date().getFullYear(),0,1))/604800000)+1,52);
                const t = WEEKLY_TOPICS[w-1];
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {[["📝 Blog A",t.blogA],["📝 Blog B",t.blogB],["📸 Instagram",t.ig],["🎬 TikTok",t.tiktok]].map(([label,topic])=>(
                      <div key={label} style={{background:"#141820",borderRadius:6,padding:12}}>
                        <div style={{fontSize:11,color:"#7A8899",fontFamily:"monospace",marginBottom:4}}>{label}</div>
                        <div style={{fontSize:13,color:"#F0F4F8",lineHeight:1.4}}>{topic}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══ CONTENT VIEWER ═══════════════════════════════════════════════ */}
        {view==="content" && (
          <div style={S.page}>
            <div style={S.pageHeader}>
              <h1 style={S.pageTitle}>Content</h1>
              <div style={{display:"flex",gap:8}}>
                <select style={S.select} onChange={e=>{const t=queue.find(q=>q.id===e.target.value);if(t)setSelectedTask(t)}}>
                  <option value="">Select a task…</option>
                  {readyTasks.map(t=><option key={t.id} value={t.id}>{t.date} · {t.platform} · {CONTENT_TYPES[t.contentType]?.label}</option>)}
                </select>
              </div>
            </div>

            {!selectedTask && (
              <div style={{...S.empty,padding:48,textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:16}}>📄</div>
                <div style={{color:"#7A8899",fontFamily:"monospace"}}>Select a task from the queue or click a task on the Dashboard</div>
                <div style={{marginTop:16,color:"#4A5568",fontSize:12,fontFamily:"monospace"}}>{stats.ready} ready tasks available</div>
              </div>
            )}

            {selectedTask && (
              <div>
                {/* Task header */}
                <div style={{...S.card,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <span style={{fontSize:28}}>{PLATFORM_CONFIG[selectedTask.platform]?.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontWeight:800,fontSize:16,color:"#F0F4F8"}}>{CONTENT_TYPES[selectedTask.contentType]?.label}</span>
                        <span style={{...S.chip,background:PLATFORM_CONFIG[selectedTask.platform]?.color+"33",color:PLATFORM_CONFIG[selectedTask.platform]?.color}}>{selectedTask.platform}</span>
                        <span style={{...S.chip,background:statusColor[selectedTask.status]+"22",color:statusColor[selectedTask.status]}}>{selectedTask.status}</span>
                        <span style={{...S.chip,background:"#252D3D",color:"#7A8899"}}>Week {selectedTask.week}</span>
                      </div>
                      <div style={S.taskSub}>{selectedTask.date} · {WEEKLY_TOPICS[Math.min(selectedTask.week-1,51)].blogA.slice(0,60)}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {selectedTask.status==="pending" && <button style={S.btn} onClick={()=>generateTask(selectedTask)} disabled={!!generatingId}>{generatingId===selectedTask.id?"⏳ Generating…":"⚡ Generate"}</button>}
                      {selectedTask.status==="failed" && <button style={{...S.btn,...S.btnRed}} onClick={()=>generateTask(selectedTask)}>↺ Retry</button>}
                      {selectedTask.status==="ready" && <><button style={S.btn} onClick={()=>markApproved(selectedTask.id)}>✓ Mark Approved</button><button style={{...S.btn,...S.btnGreen}} onClick={()=>markPosted(selectedTask.id)}>✓ Mark as Posted</button></>}
                      {selectedTask.status==="approved" && <button style={{...S.btn,...S.btnGreen}} onClick={()=>markPosted(selectedTask.id)}>✓ Mark as Posted</button>}
                    </div>
                  </div>
                </div>

                {/* Content display */}
                {selectedTask.status==="generating" && (
                  <div style={{...S.card,textAlign:"center",padding:48}}>
                    <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite"}}>⚡</div>
                    <div style={{color:"#E07B2A",fontFamily:"monospace"}}>Generating with {LLM_PROVIDERS[llmProvider]?.label || llmProvider}…</div>
                  </div>
                )}

                {selectedTask.status==="pending" && (
                  <div style={{...S.card,textAlign:"center",padding:48}}>
                    <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                    <div style={{color:"#7A8899",fontFamily:"monospace"}}>Not yet generated —