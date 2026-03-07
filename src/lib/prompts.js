const BRAND = `Bannerman Leasing (product: RentLease App) – a modern property and equipment leasing platform. Brand voice: professional, trustworthy, approachable, forward-thinking.`

export function buildSystemPrompt() {
  return `You are a senior marketing content strategist for ${BRAND}. Write compelling, accurate, on-brand content. Use British English spelling. Never fabricate statistics. Always include a clear call-to-action.`
}

export function buildUserPrompt({ platform, topic, brief }) {
  const topicLine = topic ? `Topic / headline: ${topic}` : ''
  const briefLine = brief ? `Additional context / brief: ${brief}` : ''
  const context = [topicLine, briefLine].filter(Boolean).join('\n')

  const platformGuides = {
    blog: `Write a blog post (800–1 200 words) for the Bannerman Leasing website.
Structure: engaging intro, 3–5 H2 sections, conclusion with CTA.
Include SEO-friendly headings. Output in Markdown.
${context}`,

    instagram: `Write an Instagram caption for Bannerman Leasing.
150–300 words. Start with a hook. Include a CTA. End with 15–20 relevant hashtags on a new line.
${context}`,

    tiktok: `Write a TikTok video script for Bannerman Leasing (60–90 second read-through).
Format: [HOOK] (first 3 seconds), [CONTENT] (main body with step-by-step or story), [CTA] (last 5 seconds).
Suggest 2–3 trending audio styles at the bottom.
${context}`,

    linkedin: `Write a LinkedIn post for Bannerman Leasing.
150–300 words. Professional but conversational. Share an insight or tip. End with a question to drive comments.
${context}`,

    twitter: `Write a Twitter/X thread for Bannerman Leasing.
5–10 tweets. Tweet 1 is the hook. Each tweet is ≤ 280 characters. Number each tweet (1/, 2/, …).
Last tweet = CTA + link placeholder.
${context}`,

    facebook_ad: `Write a Facebook/Meta ad for Bannerman Leasing.
Output:
HEADLINE: (≤ 40 chars)
PRIMARY TEXT: (50–125 words, conversational, benefit-led)
DESCRIPTION: (≤ 30 chars)
CTA BUTTON: one of [Learn More | Sign Up | Get Quote | Contact Us]
${context}`,

    google_ad: `Write a Google Responsive Search Ad for Bannerman Leasing.
Output exactly:
HEADLINES (provide 10, each ≤ 30 chars):
1. …
…
DESCRIPTIONS (provide 4, each ≤ 90 chars):
1. …
…
${context}`,
  }

  return platformGuides[platform] ?? `Write marketing content for ${platform} about Bannerman Leasing.\n${context}`
}
