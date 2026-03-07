/**
 * Shared LLM caller for generate.js and run-daily. No request parsing—call with (env, provider, model, system, messages, maxTokens).
 */

const ANTHROPIC_DEFAULT = "claude-sonnet-4-20250514";
const OPENAI_DEFAULT = "gpt-4o";
const GOOGLE_DEFAULT = "gemini-1.5-flash";

export async function callLLM(env, provider, model, system, messages, maxTokens) {
  const p = (typeof provider === "string" ? provider : "").toLowerCase();
  switch (p) {
    case "anthropic":
      return callAnthropic(env, model, system, messages, maxTokens);
    case "openai":
      return callOpenAI(env, model, system, messages, maxTokens);
    case "google":
      return callGoogle(env, model, system, messages, maxTokens);
    default:
      throw new Error(`Unknown provider: ${provider}. Use anthropic, openai, or google.`);
  }
}

async function callAnthropic(env, model, system, messages, maxTokens) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("Server is missing ANTHROPIC_API_KEY for Anthropic.");
  }
  const m = model || ANTHROPIC_DEFAULT;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: m,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Anthropic ${res.status}`);
  }
  const text = data?.content?.[0]?.text;
  if (!text || typeof text !== "string") throw new Error("Unexpected Anthropic response format.");
  return text;
}

async function callOpenAI(env, model, system, messages, maxTokens) {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("Server is missing OPENAI_API_KEY for OpenAI.");
  const m = model || OPENAI_DEFAULT;
  const openAIMessages = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages,
  ];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: m,
      messages: openAIMessages,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI ${res.status}`);
  }
  const text = data?.choices?.[0]?.message?.content;
  if (text === undefined || text === null) throw new Error("Unexpected OpenAI response format.");
  return String(text);
}

async function callGoogle(env, model, system, messages, maxTokens) {
  const key = env.GOOGLE_API_KEY || env.GEMINI_API_KEY;
  if (!key) throw new Error("Server is missing GOOGLE_API_KEY or GEMINI_API_KEY for Google.");
  const m = model || GOOGLE_DEFAULT;
  const userContent = messages.map((msg) => (typeof msg.content === "string" ? msg.content : "")).join("\n\n");
  const body = {
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Google ${res.status}`);
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") throw new Error("Unexpected Google response format.");
  return text;
}
