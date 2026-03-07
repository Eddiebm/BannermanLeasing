# Bannerman Leasing – Content Studio

> Plan and generate a year of content (blog, social, ads) with Claude, GPT-4, or Gemini — no API keys in the browser. Review, approve, export; optional fully automated daily runs.

## Features

| Feature | Details |
|---------|---------|
| 📅 365-day calendar | Visual monthly grid; click any day to view or edit content items |
| ✨ Multi-LLM generation | Claude 3.5 Sonnet (Anthropic), GPT-4o (OpenAI), Gemini 1.5 Pro (Google) |
| 🔒 Server proxy | API keys stay in Cloudflare Pages environment variables – never sent to the browser |
| 🗂 Content queue | Filterable, searchable list with status tracking (pending → generated → approved → exported) |
| 📤 Export | Download approved (or all) items as CSV or JSON |
| 🤖 Daily automation | Optional GitHub Actions cron + Cloudflare Function to auto-generate each day's content |
| 🗄 Supabase (optional) | Persist content across devices; required for daily automation |

**Supported content types:** Blog post · Instagram · TikTok · LinkedIn · Twitter/X · Facebook Ad · Google Ad

---

## Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router v6
- **Proxy / API:** Cloudflare Pages Functions (Edge Workers)
- **AI providers:** Anthropic, OpenAI, Google AI
- **Storage:** `localStorage` (default) + optional Supabase PostgreSQL
- **Automation:** GitHub Actions (cron) → Cloudflare Pages cron endpoint

---

## Quick start

### Prerequisites
- Node.js 18+ and npm
- A Cloudflare account ([free tier works](https://developers.cloudflare.com/pages/))
- At least one AI API key (Anthropic / OpenAI / Google)

### 1. Clone & install

```bash
git clone https://github.com/Eddiebm/BannermanLeasing.git
cd BannermanLeasing
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | for Claude | Anthropic console API key |
| `OPENAI_API_KEY` | for GPT-4o | OpenAI platform API key |
| `GOOGLE_AI_API_KEY` | for Gemini | Google AI Studio API key |
| `CRON_SECRET` | for automation | Random secret shared between GitHub Actions and the cron endpoint |
| `VITE_SUPABASE_URL` | optional | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | optional | Supabase anon public key |

### 3. Local development

```bash
# Start Vite dev server (UI only, /api calls go to wrangler below)
npm run dev

# In a second terminal – start Cloudflare Pages local emulation (proxies /api)
npx wrangler pages dev dist --port 8788
# or, for hot-reload of functions without building first:
npx wrangler pages dev --proxy 5173 --port 8788
```

Open http://localhost:5173

### 4. Build

```bash
npm run build
```

The output is in `dist/`. The `functions/` folder is picked up automatically by Cloudflare Pages.

---

## Cloudflare Pages deployment

### Manual deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name bannerman-leasing-content
```

### GitHub Actions (CI/CD)

The included `.github/workflows/deploy.yml` workflow builds and deploys on every push to `main`.

Add these repository secrets:

| Secret | Where to find it |
|--------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token (use "Edit Cloudflare Pages" template) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar |

Then set your **AI API keys** as **encrypted environment variables** in the Cloudflare Pages project:

1. Cloudflare dashboard → Pages → your project → Settings → Environment variables
2. Add `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` (Production + Preview) – tick **Encrypt**

---

## Optional: Supabase persistence

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the migration

```bash
# With Supabase CLI
supabase db push

# Or paste supabase/migrations/001_init.sql into the SQL editor
```

### 3. Add environment variables

In `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Also add these to Cloudflare Pages environment variables.

---

## Optional: Daily automation

Requires Supabase (content must be persisted server-side).

### 1. Set up GitHub Actions secrets

| Secret | Value |
|--------|-------|
| `CONTENT_APP_URL` | Your Cloudflare Pages URL, e.g. `https://bannerman-leasing-content.pages.dev` |
| `CRON_SECRET` | Same random string you set in Cloudflare env vars |

### 2. Enable the workflow

The `.github/workflows/daily-content.yml` workflow runs every day at 06:00 UTC.
It POSTs to `/api/cron` with the `CRON_SECRET` bearer token, which triggers Claude to
generate content for all pending items scheduled for that day and save them back to Supabase.

You can also trigger it manually from the GitHub Actions tab (supports dry-run mode).

---

## Rate limits

The `/api/generate` endpoint enforces **20 requests per IP per minute** by default.
Adjust the `RATE_LIMIT_REQUESTS` environment variable in `wrangler.toml` or Cloudflare dashboard.

---

## Project structure

```
├── functions/
│   └── api/
│       ├── generate.js   # Multi-LLM proxy (Cloudflare Pages Function)
│       └── cron.js       # Daily automation endpoint
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context (content state)
│   ├── hooks/            # useContent, useGenerate
│   ├── lib/              # contentTypes, prompts, exportUtils, supabase
│   └── pages/            # Calendar, Queue, Generator
├── supabase/
│   └── migrations/       # SQL schema
└── .github/
    └── workflows/        # deploy.yml, daily-content.yml
```

---

## License

MIT © Bannerman Leasing
