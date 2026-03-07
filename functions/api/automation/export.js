/**
 * Export tasks from Supabase as JSON or CSV.
 * Route: GET /api/automation/export?format=json|csv&status=ready|posted|all (default: ready)
 */
import { json, requireAutomationKey, supabaseRequest } from "./_lib.js";
import { withCors, optionsResponse } from "../_cors.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const authError = requireAutomationKey(request, env);
  if (authError) return withCors(authError, env);

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") || "json").toLowerCase();
  const status = url.searchParams.get("status") || "ready";

  try {
    let path = "cm_tasks?order=date.asc,scheduled_at.asc";
    if (status !== "all") {
      path += `&status=eq.${encodeURIComponent(status)}`;
    }
    const tasks = await supabaseRequest(env, path, "GET");
    const list = Array.isArray(tasks) ? tasks : [];

    if (format === "csv") {
      const header = "task_id,date,platform,content_type,status,generated_at";
      const rows = list.map((t) =>
        [t.task_id, t.date, t.platform, t.content_type, t.status, t.generated_at || ""].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      );
      const body = [header, ...rows].join("\n");
      const res = new Response(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cm-export-${status}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
      return withCors(res, env);
    }

    const res = new Response(JSON.stringify({ exported: list.length, status, tasks: list }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cm-export-${status}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
    return withCors(res, env);
  } catch (error) {
    return withCors(json({ error: error.message }, 500), env);
  }
}

export async function onRequestOptions(context) {
  return optionsResponse(context.env);
}
