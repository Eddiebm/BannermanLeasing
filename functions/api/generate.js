// Cloudflare Pages Function – server-side AI proxy
// Environment variables (set as encrypted secrets in CF dashboard):
//   ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Simple in-memory rate-limiter (resets on cold start).
// For production use Cloudflare KV for persistence.
const rateMap = new Map()

function isAllowed(ip, limitPerMin = 20) {
  const now = Date.now()
  const window = 60_000
  const entry = rateMap.get(ip)

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + window })
    return true
  }
  if (entry.count >= limitPerMin) return false
  entry.count += 1
  return true
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost(context) {
  const { request, env } = context

  // Rate limiting
  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0'
  const limit = Number(env.RATE_LIMIT_REQUESTS ?? 20)
  if (!isAllowed(ip, limit)) {
    return json({ error: 'Too many requests – please wait a minute.' }, 429)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const { model, prompt, system } = body ?? {}
  if (!model || !prompt) return json({ error: 'model and prompt are required.' }, 400)

  try {
    let content
    if (model === 'claude') content = await callClaude(env.ANTHROPIC_API_KEY, prompt, system)
    else if (model === 'gpt4') content = await callGPT4(env.OPENAI_API_KEY, prompt, system)
    else if (model === 'gemini') content = await callGemini(env.GOOGLE_AI_API_KEY, prompt, system)
    else return json({ error: `Unknown model: ${model}` }, 400)

    return json({ content })
  } catch (err) {
    console.error('[generate]', err)
    return json({ error: err.message ?? 'Generation failed.' }, 502)
  }
}

// ─── LLM helpers ────────────────────────────────────────────────────────────

async function callClaude(apiKey, prompt, system) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured.')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: system ?? defaultSystem(),
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  await assertOk(res, 'Anthropic')
  const data = await res.json()
  return data.content[0].text
}

async function callGPT4(apiKey, prompt, system) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.')
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: system ?? defaultSystem() },
        { role: 'user', content: prompt },
      ],
    }),
  })
  await assertOk(res, 'OpenAI')
  const data = await res.json()
  return data.choices[0].message.content
}

async function callGemini(apiKey, prompt, system) {
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not configured.')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
  const combinedPrompt = system ? `${system}\n\n${prompt}` : prompt
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: combinedPrompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    }),
  })
  await assertOk(res, 'Google Gemini')
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function defaultSystem() {
  return 'You are a senior marketing content strategist for Bannerman Leasing (RentLease App). Write compelling, on-brand content.'
}

async function assertOk(res, provider) {
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText)
    throw new Error(`${provider} API error ${res.status}: ${body}`)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
