/**
 * Cloudflare Pages Function proxy for Anthropic Messages API.
 *
 * Route: POST /api/anthropic/messages
 * Required env var: ANTHROPIC_API_KEY
 * Optional env var: BANNERMAN_CLIENT_TOKEN
 */
import { withCors, optionsResponse } from "../_cors.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ANTHROPIC_API_KEY) {
    return withCors(json({ error: { message: "Server is missing ANTHROPIC_API_KEY." } }, 500), env);
  }

  const requiredClientToken = env.BANNERMAN_CLIENT_TOKEN;
  if (!requiredClientToken) {
    return withCors(json({ error: { message: "Server misconfiguration: BANNERMAN_CLIENT_TOKEN is not set." } }, 500), env);
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

  const model = typeof body.model === "string" ? body.model : "claude-sonnet-4-20250514";
  const maxTokens = Number.isFinite(body.max_tokens) ? body.max_tokens : 2000;
  const system = typeof body.system === "string" ? body.system : "";
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (messages.length === 0) {
    return withCors(json({ error: { message: "At least one user message is required." } }, 400), env);
  }

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const text = await upstream.text();
  const res = new Response(text, {
    status: upstream.status,
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

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
