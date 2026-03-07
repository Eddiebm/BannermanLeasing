/**
 * Health check: which LLM providers have keys configured (no key values exposed).
 * Route: GET /api/health
 */
import { withCors, optionsResponse } from "./_cors.js";

export async function onRequestGet(context) {
  const { env } = context;
  const body = JSON.stringify({
    ok: true,
    at: new Date().toISOString(),
    llm: {
      anthropic: !!env.ANTHROPIC_API_KEY,
      openai: !!env.OPENAI_API_KEY,
      google: !!(env.GOOGLE_API_KEY || env.GEMINI_API_KEY),
    },
  });
  const res = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
  return withCors(res, env);
}

export async function onRequestOptions(context) {
  return optionsResponse(context.env);
}
