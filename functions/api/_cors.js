/**
 * CORS helper for API routes. Set ALLOWED_ORIGIN in env to restrict (e.g. https://app.example.com).
 */
export function corsHeaders(env = {}) {
  const origin = env.ALLOWED_ORIGIN;
  if (!origin || origin === "*") {
    // By default, only allow same-origin requests or specify a strict origin.
    // Wildcard '*' is disallowed for security reasons.
    throw new Error("ALLOWED_ORIGIN env var is not securely set. It cannot be empty or '*'. Please specify a strict origin.");
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-bannerman-token, x-cm-automation-key",
    "Access-Control-Max-Age": "86400",
  };
}

export function withCors(response, env) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(env))) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function optionsResponse(env) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env),
  });
}