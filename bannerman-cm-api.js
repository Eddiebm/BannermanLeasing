import { BRAND_CONTEXT, LLM_PROVIDERS, WEEKLY_TOPICS } from "./bannerman-cm-config.js";

/**
 * @typedef {Object} ContentTask
 * @property {string} id
 * @property {string} platform
 * @property {string} contentType
 * @property {"blog"|"carousel"|"tiktok"|"linkedin"|"tweet"|"static"} generatorType
 * @property {number} week
 */

/**
 * Extract a section between `---TAG---` markers.
 * @param {string} raw
 * @param {string} tag
 * @returns {string}
 */
export function parseSection(raw, tag) {
  return raw.match(new RegExp(`---${tag}---\\n([\\s\\S]*?)(?=\\n---|$)`))?.[1]?.trim() || "";
}

/**
 * Parse proxy error responses safely.
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function parseErrorBody(response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.error?.message || parsed.message || text;
  } catch {
    return text || `API error ${response.status}`;
  }
}

/**
 * Call the unified LLM proxy (Anthropic, OpenAI, or Google).
 * @param {string} providerId One of: anthropic, openai, google
 * @param {string|null} model Model id, or null to use provider default
 * @param {string} apiKey Optional client token for proxy auth
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} [maxTokens=2000]
 * @returns {Promise<string>}
 */
export async function callLLM(providerId, model, apiKey, systemPrompt, userPrompt, maxTokens = 2000) {
  const trimmedToken = apiKey?.trim();
  const headers = { "Content-Type": "application/json" };
  if (trimmedToken) headers["x-bannerman-token"] = trimmedToken;

  const provider = LLM_PROVIDERS[providerId];
  const effectiveModel = model || provider?.defaultModel || null;

  const response = await fetch("/api/llm/generate", {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: providerId,
      model: effectiveModel,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const message = await parseErrorBody(response);
    if (response.status === 404) {
      throw new Error("Proxy endpoint not found at /api/llm/generate. Deploy the server endpoint first.");
    }
    throw new Error(message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("Unexpected model response format.");
  }
  return text;
}

/**
 * @param {string} apiKey Optional client token for proxy auth.
 * @param {ContentTask} task
 * @param {{ provider?: string, model?: string }} [options] LLM provider id and optional model override.
 * @returns {Promise<Record<string, any>>}
 */
export async function generateContent(apiKey, task, options = {}) {
  const provider = options.provider || "anthropic";
  const model = options.model || null;
  const topic = WEEKLY_TOPICS[Math.min(task.week - 1, 51)];
  const sys = BRAND_CONTEXT;

  const call = (userPrompt, maxT = 2000) => callLLM(provider, model, apiKey, sys, userPrompt, maxT);

  if (task.generatorType === "blog") {
    const isA = task.contentType === "blog_post_a";
    const title = isA ? topic.blogA : topic.blogB;
    const raw = await call(
`Write a 1,600-word SEO-optimized blog post for independent landlords.
TITLE: ${title}
TARGET KEYWORD: ${title.toLowerCase()}
${!isA ? "STATE FOCUS: include state-specific landlord-tenant law, required clauses, statutes." : ""}

STRUCTURE:
1. H1 with keyword
2. Intro 150w: state the problem, preview
3. H2: "What Is [topic]?" 150w
4. H2: Main section 1 — numbered steps
5. H2: Main section 2
6. H2: Main section 3
7. H2: FAQ — 4-6 questions as H3s (triggers People Also Ask)
8. Conclusion 75w + CTA: "Start free at leasingapp.pages.dev"

OUTPUT:
---META---
[meta description 120-155 chars]
---CONTENT---
[full markdown blog post]`, 3000);

    const meta = parseSection(raw, "META");
    const content = parseSection(raw, "CONTENT") || raw;
    return { title, meta, content, wordCount: content.split(" ").length };
  }

  if (task.generatorType === "carousel") {
    const topicText = task.contentType === "product_demo" ? `${topic.ig} — product demo` : topic.ig;
    const raw = await call(
`Create an Instagram carousel for landlords.
TOPIC: ${topicText}
PILLAR: ${topic.pillar}

---COVER---
[Bold headline ≤8 words + subhead teasing value]
---SLIDES---
[8 slides: "SLIDE N: headline ≤6 words / 2-sentence body" each]
---CTA---
[Final: follow @bannermanleasing + leasingapp.pages.dev]
---CAPTION---
[Hook line + 3 value lines + save/share CTA + "link in bio — no credit card"]
---HASHTAGS---
[8 hashtags]`, 1200);

    return {
      cover: parseSection(raw, "COVER"),
      slides: parseSection(raw, "SLIDES"),
      cta: parseSection(raw, "CTA"),
      caption: parseSection(raw, "CAPTION"),
      hashtags: parseSection(raw, "HASHTAGS"),
    };
  }

  if (task.generatorType === "tiktok") {
    const formats = ["tutorial","cost_reveal","myth_bust","demo","story","trending"];
    const fmt = formats[task.week % formats.length];
    const raw = await call(
`Write a 60-second TikTok script for landlords.
TOPIC: ${topic.tiktok}
FORMAT: ${fmt}

[0-3s] HOOK — one sentence, stops scroll instantly
[3-15s] PROBLEM — personal, specific
[15-50s] SOLUTION — practical, numbered if tutorial
[50-60s] CTA — "link in bio to start free"

---SCRIPT---
[Full script with [VISUAL: cue] notes and ON-SCREEN TEXT in CAPS]
---CAPTION---
[2-line caption]
---HASHTAGS---
[6 hashtags]
---ALT_HOOKS---
[3 alternative opening hooks]`, 1000);

    return {
      format: fmt,
      script: parseSection(raw, "SCRIPT"),
      caption: parseSection(raw, "CAPTION"),
      hashtags: parseSection(raw, "HASHTAGS"),
      altHooks: parseSection(raw, "ALT_HOOKS"),
    };
  }

  if (task.generatorType === "linkedin") {
    const isPersonal = task.contentType === "personal_post";
    const raw = await call(
`Write a LinkedIn post for Bannerman Leasing.
ACCOUNT: ${isPersonal ? "personal founder" : "company page"}
TOPIC: ${topic.ig}
PILLAR: ${topic.pillar}
RULES: Line 1 = standalone hook (the "see more" trigger, ≤12 words, never starts "I"). Single-line paragraphs. NO links in body. Max 1300 chars. End with question or soft CTA.

---POST---
[Full post with LinkedIn line breaks]
---FIRST_COMMENT---
[First comment with leasingapp.pages.dev link]
---HASHTAGS---
[3 hashtags]`, 800);

    return {
      post: parseSection(raw, "POST"),
      firstComment: parseSection(raw, "FIRST_COMMENT"),
      hashtags: parseSection(raw, "HASHTAGS"),
      account: isPersonal ? "personal" : "company",
    };
  }

  if (task.generatorType === "tweet") {
    const isThread = task.contentType === "thread";
    const raw = await call(
`Write a ${isThread ? "10-tweet thread" : "single tweet (≤280 chars)"} for @bannermanleasing.
TOPIC: ${isThread ? topic.blogA : topic.ig}
${isThread ? "Number each tweet [1/10] etc. Tweet 10 ends with leasingapp.pages.dev" : "Useful or surprising, not promotional."}

---TWEET---
[content]`, isThread ? 1500 : 300);

    const content = parseSection(raw, "TWEET") || raw;
    return { content, isThread, charCount: content.length };
  }

  if (task.generatorType === "static") {
    const raw = await call(
`Write content for a static Instagram graphic.
TOPIC: ${topic.ig}
---STAT---
[1-2 sentence shareable stat or insight for the graphic]
---CAPTION---
[Hook + 3 value lines + save CTA + link in bio]
---HASHTAGS---
[8 hashtags]`, 600);

    return {
      stat: parseSection(raw, "STAT"),
      caption: parseSection(raw, "CAPTION"),
      hashtags: parseSection(raw, "HASHTAGS"),
    };
  }

  return { raw: `Generator not found for type: ${task.generatorType}` };
}
