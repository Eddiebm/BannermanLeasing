import { useState } from "react";

/**
 * @param {{
 *   task: { generatorType: string, content: Record<string, any> },
 *   styles: Record<string, any>
 * }} props
 */
export default function ContentDisplay({ task, styles: S }) {
  const c = task.content;
  const [copied, setCopied] = useState(null);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const CopyBtn = ({ text, label }) => (
    <button style={{ ...S.btnSm, marginLeft:8 }} onClick={() => copy(text, label)}>
      {copied === label ? "✓ Copied!" : "Copy"}
    </button>
  );

  const Block = ({ title, content, color = "#7A8899" }) => content ? (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ fontSize:11, color, fontFamily:"monospace", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" }}>{title}</div>
        <CopyBtn text={content} label={title} />
      </div>
      <div style={{ background:"#0D1117", borderRadius:6, padding:12, color:"#B8C5D6", fontSize:13, lineHeight:1.7, fontFamily:"monospace", whiteSpace:"pre-wrap", wordBreak:"break-word", maxHeight:320, overflowY:"auto" }}>
        {content}
      </div>
    </div>
  ) : null;

  if (task.generatorType === "blog") return (
    <div>
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <h3 style={S.cardTitle}>📝 {c.title}</h3>
          <span style={{ fontSize:11, color:"#7A8899", fontFamily:"monospace" }}>{c.wordCount?.toLocaleString()} words</span>
        </div>
        <Block title="Meta Description" content={c.meta} color="#E07B2A" />
        <Block title="Full Blog Post (Markdown)" content={c.content} />
        {c.internalLinks && <Block title="Suggested Internal Links" content={c.internalLinks} color="#22C55E" />}
      </div>
    </div>
  );

  if (task.generatorType === "carousel") return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>📸 Instagram Carousel</h3>
      <Block title="Cover Slide" content={c.cover} color="#C13584" />
      <Block title="Slides 2–9" content={c.slides} />
      <Block title="CTA Slide" content={c.cta} color="#E07B2A" />
      <Block title="Caption" content={c.caption} />
      <Block title="Hashtags" content={c.hashtags} color="#9B6FD4" />
    </div>
  );

  if (task.generatorType === "tiktok") return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>🎬 TikTok Script — {c.format}</h3>
      <Block title="Script (with visual cues)" content={c.script} color="#69C9D0" />
      <Block title="Caption" content={c.caption} />
      <Block title="Hashtags" content={c.hashtags} color="#9B6FD4" />
      <Block title="Alt Hooks (A/B Test)" content={c.altHooks} color="#E07B2A" />
    </div>
  );

  if (task.generatorType === "linkedin") return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>💼 LinkedIn Post — {c.account}</h3>
      <Block title="Post (NO links in body — goes in first comment)" content={c.post} color="#0077B5" />
      <Block title="First Comment (with link)" content={c.firstComment} color="#22C55E" />
      <Block title="Hashtags" content={c.hashtags} color="#9B6FD4" />
    </div>
  );

  if (task.generatorType === "tweet") return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>🐦 {c.isThread ? "Twitter Thread" : "Tweet"}</h3>
      {!c.isThread && <div style={{ fontSize:11, color:c.charCount > 280 ? "#EF4444" : "#22C55E", fontFamily:"monospace", marginBottom:8 }}>{c.charCount}/280 chars</div>}
      <Block title={c.isThread ? "Thread (10 tweets)" : "Tweet"} content={c.content} color="#1DA1F2" />
    </div>
  );

  if (task.generatorType === "static") return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>📊 Static Instagram Graphic</h3>
      <Block title="Graphic Text (stat/quote)" content={c.stat} color="#C13584" />
      <Block title="Caption" content={c.caption} />
      <Block title="Hashtags" content={c.hashtags} color="#9B6FD4" />
    </div>
  );

  return <div style={S.card}><pre style={{ color:"#7A8899", fontSize:12, fontFamily:"monospace", whiteSpace:"pre-wrap" }}>{JSON.stringify(c, null, 2)}</pre></div>;
}
