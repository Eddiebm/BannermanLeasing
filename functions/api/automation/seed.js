import { buildQueueRows, json, requireAutomationKey, supabaseRequest } from "./_lib.js";
import { withCors, optionsResponse } from "../_cors.js";

/**
 * Seeds 365 days of automation tasks into Supabase.
 * Route: POST /api/automation/seed
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const authError = requireAutomationKey(request, env);
  if (authError) return withCors(authError, env);

  let payload = {};
  try {
    payload = await request.json();
  } catch {}

  const days = Number.isFinite(payload.days) ? Math.max(1, Math.min(730, payload.days)) : 365;
  const fromDate = payload.fromDate ? new Date(payload.fromDate) : new Date();
  if (Number.isNaN(fromDate.getTime())) {
    return withCors(json({ error: { message: "Invalid fromDate." } }, 400), env);
  }

  try {
    const rows = buildQueueRows(fromDate, days);
    const inserted = await supabaseRequest(env, "cm_tasks", "POST", rows);
    return withCors(json({
      ok: true,
      seeded: inserted?.length || 0,
      requested: rows.length,
      fromDate: fromDate.toISOString().slice(0, 10),
      days,
    }), env);
  } catch (error) {
    return withCors(json({ error: { message: error.message } }, 500), env);
  }
}

export async function onRequestOptions(context) {
  return optionsResponse(context.env);
}
