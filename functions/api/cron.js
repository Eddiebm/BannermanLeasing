// Cloudflare Pages Function – daily automation endpoint
// Called by GitHub Actions (.github/workflows/daily-content.yml) with a Bearer token.
// Environment variables:
//   CRON_SECRET        – shared secret validated below
//   ANTHROPIC_API_KEY  – used as default model for auto-generation
//   VITE_SUPABASE_URL  – Supabase project URL
//   VITE_SUPABASE_SERVICE_ROLE_KEY – service-role key (NOT the anon key)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost(context) {
  const { request, env } = context

  // Auth
  const auth = request.headers.get('Authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Require Supabase
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Supabase not configured – set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY.' }, 503)
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    // Fetch pending items for today from Supabase
    const pendingRes = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/content_items?date=eq.${today}&status=eq.pending&select=*`,
      {
        headers: {
          apikey: env.VITE_SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )
    if (!pendingRes.ok) throw new Error(`Supabase fetch failed: ${pendingRes.status}`)
    const pending = await pendingRes.json()

    if (pending.length === 0) {
      return json({ message: `No pending items for ${today}.`, generated: 0 })
    }

    // Generate content for each pending item
    const results = await Promise.allSettled(
      pending.map((item) => generateAndUpdate(item, env))
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return json({ date: today, total: pending.length, generated: succeeded, failed })
  } catch (err) {
    console.error('[cron]', err)
    return json({ error: err.message }, 500)
  }
}

async function generateAndUpdate(item, env) {
  // Simple generation via Claude (default model for automation)
  const systemPrompt = 'You are a marketing content strategist for Bannerman Leasing (RentLease App).'
  const userPrompt = item.topic
    ? `Write ${item.platform} content about: ${item.topic}. ${item.brief ?? ''}`
    : `Write a ${item.platform} post for Bannerman Leasing.`

  const genRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!genRes.ok) {
    const msg = await genRes.text()
    throw new Error(`Claude error ${genRes.status}: ${msg}`)
  }

  const genData = await genRes.json()
  const content = genData.content[0].text

  // Update Supabase record
  const updateRes = await fetch(
    `${env.VITE_SUPABASE_URL}/rest/v1/content_items?id=eq.${item.id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.VITE_SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        content: { body: content },
        status: 'generated',
        model: 'claude',
        updated_at: new Date().toISOString(),
      }),
    }
  )

  if (!updateRes.ok) {
    throw new Error(`Supabase update failed for ${item.id}: ${updateRes.status}`)
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
