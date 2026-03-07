/**
 * Retry failed tasks: fetches up to N failed tasks, re-runs generation, updates to ready or failed.
 * Route: POST /api/automation/retry-failed
 * Body: { limit?: number } (default 5)
 */
import { json, requireAutomationKey, supabaseRequest, topicForWeek } from "./_lib.js";
import { withCors, optionsResponse } from "../_cors.js";
import { callLLM } from "../llm/call.js";
import { BRAND_CONTEXT } from "../../../bannerman-cm-config.js";

function parseSection(raw, tag) {
  return raw.match(new RegExp(`---${tag}---\\n([\\s\\S]*?)(?=\\n---|$)`))?.[1]?.trim() || "";
}

async function callLLMForTask(env, userPrompt, maxTokens = 2000) {
  const provider = (env.CM_LLM_PROVIDER || "anthropic").toLowerCase();
  const model = env.CM_LLM_MODEL || null;
  return callLLM(env, provider, model, BRAND_CONTEXT, [{ role: "user", content: userPrompt }], maxTokens);
}

async function generateContentForTask(env, task) {
  const topic = topicForWeek(task.week);

  if (task.generator_type === "blog") {
    const isA = task.content_type === "blog_post_a";
    const title = isA ? topic.blogA : topic.blogB;
    const raw = await callLLMForTask(env,
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

  if (task.generator_type === "carousel") {
    const carouselTopic = task.content_type === "product_demo" ? `${topic.ig} — product demo` : topic.ig;
    const raw = await callLLMForTask(env,
`Create an Instagram carousel for landlords.
TOPIC: ${carouselTopic}
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

  if (task.generator_type === "tiktok") {
    const formats = ["tutorial","cost_reveal","myth_bust","demo","story","trending"];
    const fmt = formats[task.week % formats.length];
    const raw = await callLLMForTask(env,
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

  if (task.generator_type === "linkedin") {
    const isPersonal = task.content_type === "personal_post";
    const raw = await callLLMForTask(env,
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

  if (task.generator_type === "tweet") {
    const isThread = task.content_type === "thread";
    const raw = await callLLMForTask(env,
`Write a ${isThread ? "10-tweet thread" : "single tweet (≤280 chars)"} for @bannermanleasing.
TOPIC: ${isThread ? topic.blogA : topic.ig}
${isThread ? "Number each tweet [1/10] etc. Tweet 10 ends with leasingapp.pages.dev" : "Useful or surprising, not promotional."}

---TWEET---
[content]`, isThread ? 1500 : 300);
    const content = parseSection(raw, "TWEET") || raw;
    return { content, isThread, charCount: content.length };
  }

  if (task.generator_type === "static") {
    const raw = await callLLMForTask(env,
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

  throw new Error(`Generator not found for type: ${task.generator_type}`);
}

async function updateTask(env, taskId, updates) {
  const path = `cm_tasks?task_id=eq.${encodeURIComponent(taskId)}`;
  return supabaseRequest(env, path, "PATCH", updates);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authError = requireAutomationKey(request, env);
  if (authError) return withCors(authError, env);

  let body = {};
  try {
    body = await request.json();
  } catch {}
  const limit = Math.min(20, Math.max(1, Number(body.limit) || 5));

  try {
    const failedTasks = await supabaseRequest(
      env,
      `cm_tasks?status=eq.failed&order=updated_at.asc&limit=${limit}`,
      "GET"
    );

    if (!failedTasks?.length) {
      return withCors(json({ ok: true, processed: 0, message: "No failed tasks to retry." }), env);
    }

    let ready = 0;
    let failed = 0;
    const errors = [];

    for (const task of failedTasks) {
      try {
        await updateTask(env, task.task_id, { status: "generating", error: null });
        const content = await generateContentForTask(env, task);
        await updateTask(env, task.task_id, {
          status: "ready",
          content,
          generated_at: new Date().toISOString(),
          error: null,
        });
        ready += 1;
      } catch (error) {
        await updateTask(env, task.task_id, { status: "failed", error: error.message });
        failed += 1;
        errors.push({ taskId: task.task_id, message: error.message });
      }
    }

    return withCors(json({
      ok: true,
      processed: failedTasks.length,
      ready,
      failed,
      errors,
    }), env);
  } catch (error) {
    return withCors(json({ error: { message: error.message } }, 500), env);
  }
}

export async function onRequestOptions(context) {
  return optionsResponse(context.env);
}
