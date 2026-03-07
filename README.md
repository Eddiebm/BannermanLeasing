# Bannerman Content Machine

A 365-day content queue and generator for Bannerman Leasing (blog, Instagram, TikTok, LinkedIn, Twitter). Uses a server proxy so API keys never touch the browser. Supports **multiple LLMs**: Claude (Anthropic), GPT-4 (OpenAI), and Gemini (Google)—choose in Settings. Optional autonomous mode with Supabase and GitHub Actions cron.

## Quick start

```bash
git clone <your-repo-url>
cd bannerman-content-machine
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars: set ANTHROPIC_API_KEY (required for generation)
npm run dev
```

Open the app, go to **Settings** to add an optional client token if you set `BANNERMAN_CLIENT_TOKEN` in `.dev.vars`. Use **Dashboard** and **Generate** to run the queue.

## Build and deploy (Cloudflare Pages)

1. **Build**

   ```bash
   npm run build
   ```

   This runs Vite, copies `functions/` and `bannerman-cm-config.js` into `dist/`.

2. **Deploy**

   ```bash
   npx wrangler pages deploy dist --project-name bannerman-content-machine
   ```

   Set **Environment variables** in the Cloudflare Pages dashboard (Production): at least one of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY` (for the LLM(s) you use). Optionally: `BANNERMAN_CLIENT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CM_AUTOMATION_KEY`, `CM_DAILY_BATCH_SIZE`, `CM_LLM_PROVIDER`, `CM_LLM_MODEL`, `CM_WEBHOOK_URL`, `ALLOWED_ORIGIN`. For rate limiting, bind a **KV namespace** to `RATE_LIMIT_KV` (30 requests/min per IP or per client token).

- **CORS**: All API responses include CORS headers. Set `ALLOWED_ORIGIN` to restrict (e.g. `https://your-app.pages.dev`); default `*`.
- **Health**: `GET /api/health` returns `{ ok, llm: { anthropic, openai, google } }` (which keys are set; no values exposed).
- **Limits**: `/api/llm/generate` caps prompt length at 150k chars and `max_tokens` at 8192. Structured request logs (requestId, provider, status, durationMs) are written to the runtime log.

## Optional: Autonomous mode (Supabase + cron)

- **Database**: Run `bannerman-cm-supabase.sql` in your Supabase project to create the `cm_tasks` table.
- **Seed**: `POST /api/automation/seed` with optional body `{ "days": 365, "fromDate": "2025-01-01" }`. If `CM_AUTOMATION_KEY` is set, send header `x-cm-automation-key`.
- **Daily run**: `POST /api/automation/run-daily` fetches due `pending` tasks, generates content server-side (same LLM as app: set `CM_LLM_PROVIDER` and `CM_LLM_MODEL` if you want OpenAI or Google instead of Claude), and updates rows to `ready` or `failed`. Use `?dryRun=1` or body `{ "dryRun": true }` to see what would run without calling the LLM. Optional `CM_WEBHOOK_URL`: POSTed with `{ event: "run-daily", processed, ready, failed, errors }` after each run.
- **Retry failed**: `POST /api/automation/retry-failed` with optional body `{ "limit": 5 }` re-runs up to 20 failed tasks.
- **Export**: `GET /api/automation/export?format=json|csv&status=ready|posted|all` returns tasks from Supabase (requires automation key if set).
- **Status**: `GET /api/automation/status` returns queue counts and recent failures.

**GitHub Actions**

- **CM Daily Run** (`.github/workflows/cm-daily-run.yml`): runs at 06:00 UTC; POSTs to `{CM_BASE_URL}/api/automation/run-daily`.
- **CM Weekly Health** (`.github/workflows/cm-weekly-health.yml`): runs Mondays 09:00 UTC; GETs status and fails if `queue.failed` ≥ `CM_FAILED_THRESHOLD` (default 25).

**Repo configuration**

- **Secrets**: `CM_BASE_URL` (your deployed app URL, e.g. `https://bannerman-content-machine.pages.dev`), optionally `CM_AUTOMATION_KEY`.
- **Variables** (optional): `CM_FAILED_THRESHOLD` (e.g. `25`).

## Tests

```bash
npm run test        # Vitest: queue shape, parseSection, generateContent (mocked fetch)
npm run test:e2e    # Playwright: app load + Generate flow with mocked LLM
npm run test:watch  # Vitest watch mode
```

**npm audit**: Current dev dependencies may report moderate vulns in the Vite/esbuild chain (dev server only). Run `npm audit`; use `npm audit fix` when safe. Full fix can require `npm audit fix --force` (major version bumps).

## App features

- **Review workflow**: Ready → **Mark approved** → Approved → **Mark as posted** → Posted.
- **Export**: In Settings → Queue Management, **Export queue (JSON)** and **Export ready (JSON)** download the in-app queue or ready/approved/posted content.
- **Retry**: Single-task generation retries once after 2s on failure.
- **Accessibility**: Focus-visible outline on controls; aria-labels on nav and actions.

## Project layout

- **App**: `App.jsx`, `bannerman-cm-config.js`, `bannerman-cm-api.js`, `bannerman-cm-queue.js`, `bannerman-cm-content-display.jsx`, `bannerman-cm-styles.js`
- **Entry**: `index.html`, `src/main.jsx`
- **Backend**: `functions/api/_cors.js`, `functions/api/llm/generate.js`, `functions/api/llm/call.js`, `functions/api/health.js`, `functions/api/anthropic/messages.js`, `functions/api/automation/` (seed, run-daily, retry-failed, export, status)
- **Types**: `types/content-machine.d.ts` (QueueTask, ContentTask, status union)
- **Config**: `package.json`, `vite.config.js`, `vitest.config.js`, `playwright.config.js`, `wrangler.toml`, `.dev.vars.example`
- **Data**: `bannerman-cm-supabase.sql`

No secrets or local paths are committed; use `.dev.vars` locally and Cloudflare env vars in production.
