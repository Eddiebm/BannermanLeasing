export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; background: #1C2130; }
  ::-webkit-scrollbar-thumb { background: #2E3547; border-radius: 2px; }
  @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
  button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid #E07B2A; outline-offset: 2px; }
`;

export const styles = {
  root: { display:"flex", height:"100vh", background:"#141820", color:"#F0F4F8", fontFamily:"'Syne', sans-serif", overflow:"hidden" },
  sidebar: { width:220, background:"#1C2130", borderRight:"1px solid #252D3D", display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" },
  logo: { display:"flex", alignItems:"center", gap:12, padding:"20px 16px 16px", borderBottom:"1px solid #252D3D" },
  logoMark: { width:36, height:36, background:"#E07B2A", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#fff", flexShrink:0, fontFamily:"'JetBrains Mono', monospace" },
  logoName: { fontWeight:800, fontSize:14, color:"#F0F4F8", lineHeight:1 },
  logoSub: { fontSize:10, color:"#4A5568", fontFamily:"'JetBrains Mono', monospace", marginTop:2 },
  nav: { flex:1, padding:"12px 10px", overflow:"auto" },
  navBtn: { display:"flex", alignItems:"center", width:"100%", padding:"9px 12px", borderRadius:6, border:"none", background:"transparent", color:"#7A8899", cursor:"pointer", fontSize:13, fontFamily:"'Syne', sans-serif", fontWeight:600, marginBottom:2, transition:"all 0.15s", textAlign:"left" },
  navBtnActive: { background:"#E07B2A22", color:"#E07B2A" },
  navBadge: { marginLeft:"auto", background:"#E07B2A", color:"#fff", borderRadius:10, fontSize:10, padding:"1px 6px", fontFamily:"'JetBrains Mono', monospace", fontWeight:600 },
  sidebarStats: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, borderTop:"1px solid #252D3D", background:"#252D3D" },
  sidebarStat: { background:"#1C2130", padding:"10px 12px", textAlign:"center" },
  sidebarStatNum: { fontWeight:800, fontSize:18, fontFamily:"'JetBrains Mono', monospace", lineHeight:1 },
  sidebarStatLabel: { fontSize:9, color:"#4A5568", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'JetBrains Mono', monospace", marginTop:2 },
  apiStatus: { padding:"10px 14px", borderTop:"1px solid #252D3D" },
  main: { flex:1, overflowY:"auto", background:"#141820" },
  page: { maxWidth:900, margin:"0 auto", padding:"28px 24px 60px" },
  pageHeader: { display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:28, gap:16, flexWrap:"wrap" },
  pageTitle: { fontSize:28, fontWeight:900, color:"#F0F4F8", margin:0, lineHeight:1 },
  pageDate: { fontSize:12, color:"#4A5568", fontFamily:"'JetBrains Mono', monospace" },
  statGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px,1fr))", gap:12, marginBottom:28 },
  statCard: { background:"#1C2130", border:"1px solid #252D3D", borderRadius:10, padding:"18px 16px" },
  section: { marginBottom:28 },
  sectionHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  sectionTitle: { fontSize:14, fontWeight:700, color:"#F0F4F8", margin:0, fontFamily:"'JetBrains Mono', monospace", letterSpacing:"0.05em" },
  sectionCount: { fontSize:11, color:"#4A5568", fontFamily:"'JetBrains Mono', monospace" },
  taskList: { background:"#1C2130", borderRadius:8, border:"1px solid #252D3D", overflow:"hidden" },
  taskRow: { display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderBottom:"1px solid #1A2030", cursor:"pointer", transition:"background 0.12s" },
  taskName: { fontSize:13, fontWeight:600, color:"#F0F4F8" },
  taskSub: { fontSize:11, color:"#4A5568", fontFamily:"'JetBrains Mono', monospace", marginTop:2 },
  chip: { fontSize:10, padding:"2px 7px", borderRadius:4, fontFamily:"'JetBrains Mono', monospace", fontWeight:600, flexShrink:0 },
  card: { background:"#1C2130", border:"1px solid #252D3D", borderRadius:10, padding:"20px 20px", marginBottom:16 },
  cardTitle: { fontSize:14, fontWeight:700, color:"#F0F4F8", margin:"0 0 14px", fontFamily:"'JetBrains Mono', monospace" },
  empty: { color:"#4A5568", fontFamily:"'JetBrains Mono', monospace", fontSize:12, padding:20, textAlign:"center" },
  btn: { background:"#E07B2A", color:"#fff", border:"none", borderRadius:6, padding:"9px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Syne', sans-serif", transition:"all 0.15s", whiteSpace:"nowrap" },
  btnSm: { background:"#252D3D", color:"#B8C5D6", border:"none", borderRadius:5, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'JetBrains Mono', monospace", whiteSpace:"nowrap" },
  btnGreen: { background:"#22C55E" },
  btnRed: { background:"#EF4444" },
  btnDisabled: { opacity:0.5, cursor:"not-allowed" },
  select: { background:"#1C2130", border:"1px solid #2E3547", color:"#B8C5D6", borderRadius:6, padding:"7px 10px", fontSize:12, fontFamily:"'JetBrains Mono', monospace", cursor:"pointer", outline:"none" },
  input: { background:"#141820", border:"1px solid #2E3547", color:"#F0F4F8", borderRadius:6, padding:"9px 12px", fontSize:13, fontFamily:"'JetBrains Mono', monospace", outline:"none" },
};
