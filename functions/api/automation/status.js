import { json, requireAutomationKey, supabaseCount, supabaseRequest } from "./_lib.js";
import { withCors, optionsResponse } from "../_cors.js";

/**
 * Returns queue and health summary for monitoring.
 * Route: GET /api/automation/status
 * Optional: x-cm-automation-key (required if CM_AUTOMATION_KEY is set)
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  const authError = requireAutomationKey(request, env);
  if (authError) return withCors(authError, env);

  try {
    const [pending, generating, ready, posted, failed] = await Promise.all([
      supabaseCount(env, "cm_tasks?status=eq.pending"),
      supabaseCount(env, "cm_tasks?status=eq.generating"),
      supabaseCount(env, "cm_tasks?status=eq.ready"),
      supabaseCount(env, "cm_tasks?status=eq.posted"),
      supabaseCount(env, "cm_tasks?status=eq.failed"),
    ]);

    const total = pending + generating + ready + posted + failed;
    const recentFailed = await supabaseRequest(
      env,
      "cm_tasks?status=eq.failed&order=updated_at.desc&limit=5&select=task_id,date,platform,error,updated_at",
      "GET"
    );

    return withCors(json({
      ok: true,
      at: new Date().toISOString(),
      queue: {
        total,
        pending,
        generating,
        ready,
        posted,
        failed,
      },
      health: {
        failedCount: failed,
        recentFailures: recentFailed || [],
      },
    }), env);
  } catch (error) {
    return withCors(json({ ok: false, error: error.message }, 500), env);
  }
}

export async function onRequestOptions(context) {
  return optionsResponse(context.env);
}
