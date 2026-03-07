import { WEEKLY_TOPICS } from "../../../bannerman-cm-config.js";

const DAILY = {
  0: [{ p:"instagram", t:"story_series", h:10 }, { p:"twitter", t:"tweet", h:11 }],
  1: [{ p:"blog", t:"blog_post_a", h:7 }, { p:"instagram", t:"carousel", h:8 }, { p:"twitter", t:"tweet", h:8 }, { p:"linkedin", t:"company_post", h:9 }, { p:"tiktok", t:"script", h:12 }],
  2: [{ p:"linkedin", t:"personal_post", h:8 }, { p:"tiktok", t:"script", h:10 }, { p:"twitter", t:"tweet", h:12 }, { p:"instagram", t:"reel_script", h:17 }],
  3: [{ p:"instagram", t:"static_graphic", h:12 }, { p:"twitter", t:"tweet", h:12 }, { p:"tiktok", t:"script", h:15 }],
  4: [{ p:"blog", t:"blog_post_b", h:7 }, { p:"instagram", t:"carousel", h:8 }, { p:"linkedin", t:"company_post", h:8 }, { p:"twitter", t:"tweet", h:9 }, { p:"tiktok", t:"script", h:12 }],
  5: [{ p:"instagram", t:"reel_script", h:7 }, { p:"tiktok", t:"script", h:10 }, { p:"twitter", t:"tweet", h:12 }, { p:"linkedin", t:"personal_post", h:15 }],
  6: [{ p:"instagram", t:"product_demo", h:10 }, { p:"tiktok", t:"script", h:10 }, { p:"twitter", t:"thread", h:11 }],
};

const GENERATORS = {
  blog_post_a:"blog",
  blog_post_b:"blog",
  carousel:"carousel",
  reel_script:"tiktok",
  static_graphic:"static",
  product_demo:"carousel",
  story_series:"static",
  script:"tiktok",
  company_post:"linkedin",
  personal_post:"linkedin",
  tweet:"tweet",
  thread:"tweet",
};

export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function requireAutomationKey(request, env) {
  const required = env.CM_AUTOMATION_KEY;
  if (!required) return null;
  const provided = request.headers.get("x-cm-automation-key") || "";
  if (provided !== required) {
    return json({ error: { message: "Unauthorized automation key." } }, 401);
  }
  return null;
}

export function buildQueueRows(startDate = new Date(), days = 365) {
  const rows = [];
  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + dayOffset);
    const slots = DAILY[date.getDay()] || [];
    const week = Math.min(Math.floor(dayOffset / 7) + 1, 52);

    for (const slot of slots) {
      const scheduledAt = new Date(date);
      scheduledAt.setHours(slot.h, 0, 0, 0);
      rows.push({
        task_id: `${date.toISOString().slice(0,10)}_${slot.p}_${slot.t}`,
        date: date.toISOString().slice(0,10),
        scheduled_at: scheduledAt.toISOString(),
        platform: slot.p,
        content_type: slot.t,
        generator_type: GENERATORS[slot.t] || "static",
        week,
        status: "pending",
      });
    }
  }
  return rows;
}

export async function supabaseRequest(env, path, method = "GET", body) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const prefer = method === "POST"
    ? "resolution=merge-duplicates,return=representation"
    : "return=representation";
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${method} ${path} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

/**
 * Get row count for a Supabase query (uses Prefer: count=exact).
 * @param {object} env
 * @param {string} path e.g. "cm_tasks?status=eq.pending"
 * @returns {Promise<number>}
 */
export async function supabaseCount(env, path) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const sep = path.includes("?") ? "&" : "?";
  const url = `${env.SUPABASE_URL}/rest/v1/${path}${sep}select=task_id&limit=0`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
    },
  });
  const range = response.headers.get("Content-Range");
  if (!range) return 0;
  const m = range.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

export function topicForWeek(week) {
  return WEEKLY_TOPICS[Math.min(Math.max(week, 1) - 1, 51)];
}
