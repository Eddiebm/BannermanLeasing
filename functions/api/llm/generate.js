/**
 * Unified LLM proxy: routes to Anthropic, OpenAI, or Google by provider.
 * Route: POST /api/llm/generate
 * Body: { provider: "anthropic"|"openai"|"google", model?, system, messages, max_tokens }
 * Returns: { content: [{ text: string }] }
 *
 * Env: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY (or GEMINI_API_KEY)
 * Required: BANNERMAN_CLIENT_TOKEN
 * Optional: RATE_LIMIT_KV (KV namespace binding for rate limiting)
 *
 * Limits: prompt (system + messages) ≤ 150k chars; max_tokens ≤ 8192. Optional KV rate limit: 30/min per key.
 */
import { callLLM } from "./call.js";
import { withCors, optionsResponse } from "../_cors.js";

const MAX_PROMPT_CHARS = 150_000;
const MAX_MAX_TOKENS = 8192;
const RATE_LIMIT_PER_MINUTE = 30;
const RATE_LIMIT_WINDOW_SEC = 60;

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = crypto.randomUUID?.() || `req-${Date.now()}`;
  const start = Date.now();

  const requiredClientToken = env.BANNERMAN_CLIENT_TOKEN;
  if (!requiredClientToken) {
    return withCors(
      json({ error: { message: "Server misconfiguration: BANNERMAN_CLIENT_TOKEN is not set." } }, 500),
      env,
    );
  }
  const providedClientToken = request.headers.get("x-bannerman-token") || "";
  if (providedClientToken !== requiredClientToken) {
    return withCors(json({ error: { message: "Unauthorized proxy token." } }, 401), env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return withCors(json({ error: { message: "Invalid JSON body." } }, 400), env);
  }

  const provider = typeof body.provider === "string" ? body.provider.toLowerCase() : "anthropic";
  const model = typeof body.model === "string" ? body.model : null;
  const system = typeof body.system === "string" ? body.system : "";
  const messages = Array.isArray(body.messages) ? body.messages : [];
  let maxTokens = Number.isFinite(body.max_tokens) ? body.max_tokens : 2000;

  if (messages.length === 0) {
    return withCors(json({ error: { message: "At least one user message is required." } }, 400), env);
  }

  // Request size caps
  const promptLength = system.length + messages.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 0), 0);
  if (promptLength > MAX_PROMPT_CHARS) {
    return withCors(json({ error: { message: `Prompt too long (${promptLength} chars). Max ${MAX_PROMPT_CHARS}.` } }, 400), env);
  }
  maxTokens = Math.min(maxTokens, MAX_MAX_TOKENS);

  // Optional rate limiting (KV: per token or per IP)
  if (env.RATE_LIMIT_KV) {
    const rateLimitKey = providedClientToken
      ? `token:${providedClientToken.slice(0, 16)}`
      : `ip:${request.headers.get("CF-Connecting-IP") || "anon"}`;
    const rl = await checkRateLimit(env.RATE_LIMIT_KV, rateLimitKey, RATE_LIMIT_PER_MINUTE, RATE_LIMIT_WINDOW_SEC);
    if (!rl.allowed) {
      return withCors(json({ error: { message: "Rate limit exceeded. Try again later." } }, 429), env);
    }
  }

  try {
    const text = await callLLM(env, provider, model, system, messages, maxTokens);
    const duration = Date.now() - start;
    if (typeof console?.log === "function") {
      console.log(JSON.stringify({ requestId, provider, status: 200, durationMs: duration }));
    }
    return withCors(json({ content: [{ text }] }), env);
  } catch (error) {
    const duration = Date.now() - start;
    if (typeof console?.log === "function") {
      console.log(JSON.stringify({ requestId, provider, status: 500, durationMs: duration, error: error.message }));
    }
    return withCors(json({ error: { message: error.message || "LLM request failed." } }, 500), env);
  }
}

export async function onRequestOptions(context) {
  return optionsResponse(context.env);
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function checkRateLimit(kv, key, limit, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSec;
  const kvKey = `rl:${key}`;
  const raw = await kv.get(kvKey);
  let timestamps = [];
  if (raw) {
    try {
      timestamps = JSON.parse(raw).filter((t) => t > windowStart);
    } catch {
      timestamps = [];
    }
  }
  if (timestamps.length >= limit) {
    return { allowed: false };
  }
  timestamps.push(now);
  await kv.put(kvKey, JSON.stringify(timestamps), { expirationTtl: windowSec + 10 });
  return { allowed: true };
}