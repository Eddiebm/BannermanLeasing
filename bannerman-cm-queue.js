const STORAGE_KEY = "bannerman_cm_v1";

/**
 * @typedef {Object} QueueTask
 * @property {string} id
 * @property {string} date
 * @property {string} scheduledAt
 * @property {"blog"|"instagram"|"tiktok"|"linkedin"|"twitter"} platform
 * @property {string} contentType
 * @property {"blog"|"carousel"|"tiktok"|"linkedin"|"tweet"|"static"} generatorType
 * @property {number} week
 * @property {"pending"|"generating"|"ready"|"posted"|"failed"} status
 * @property {Record<string, any>|null} content
 * @property {string|null} generatedAt
 * @property {string|null} error
 */

/**
 * Load persisted queue state from session storage.
 * @returns {{queue: QueueTask[]} | null}
 */
export function loadState() {
  try {
    const serialized = sessionStorage.getItem(STORAGE_KEY);
    return serialized ? JSON.parse(serialized) : null;
  } catch {
    return null;
  }
}

/**
 * Persist queue state to session storage.
 * @param {{queue: QueueTask[]}} state
 */
export function saveState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Build 365-day content queue.
 * @returns {QueueTask[]}
 */
export function buildQueue() {
  const today = new Date();
  const queue = [];

  const DAILY = {
    0: [{p:"instagram",t:"story_series",h:10},{p:"twitter",t:"tweet",h:11}],
    1: [{p:"blog",t:"blog_post_a",h:7},{p:"instagram",t:"carousel",h:8},{p:"twitter",t:"tweet",h:8},{p:"linkedin",t:"company_post",h:9},{p:"tiktok",t:"script",h:12}],
    2: [{p:"linkedin",t:"personal_post",h:8},{p:"tiktok",t:"script",h:10},{p:"twitter",t:"tweet",h:12},{p:"instagram",t:"reel_script",h:17}],
    3: [{p:"instagram",t:"static_graphic",h:12},{p:"twitter",t:"tweet",h:12},{p:"tiktok",t:"script",h:15}],
    4: [{p:"blog",t:"blog_post_b",h:7},{p:"instagram",t:"carousel",h:8},{p:"linkedin",t:"company_post",h:8},{p:"twitter",t:"tweet",h:9},{p:"tiktok",t:"script",h:12}],
    5: [{p:"instagram",t:"reel_script",h:7},{p:"tiktok",t:"script",h:10},{p:"twitter",t:"tweet",h:12},{p:"linkedin",t:"personal_post",h:15}],
    6: [{p:"instagram",t:"product_demo",h:10},{p:"tiktok",t:"script",h:10},{p:"twitter",t:"thread",h:11}],
  };

  const GENERATORS = {
    blog_post_a:"blog", blog_post_b:"blog", carousel:"carousel", reel_script:"tiktok",
    static_graphic:"static", product_demo:"carousel", story_series:"static",
    script:"tiktok", company_post:"linkedin", personal_post:"linkedin",
    tweet:"tweet", thread:"tweet",
  };

  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

    const dow = date.getDay();
    const week = Math.min(Math.floor(dayOffset / 7) + 1, 52);
    const slots = DAILY[dow] || [];

    for (const slot of slots) {
      const scheduledAt = new Date(date);
      scheduledAt.setHours(slot.h, 0, 0, 0);
      queue.push({
        id: `${date.toISOString().slice(0,10)}_${slot.p}_${slot.t}`,
        date: date.toISOString().slice(0,10),
        scheduledAt: scheduledAt.toISOString(),
        platform: slot.p,
        contentType: slot.t,
        generatorType: GENERATORS[slot.t] || "static",
        week,
        status: "pending",
        content: null,
        generatedAt: null,
        error: null,
      });
    }
  }

  return queue;
}
