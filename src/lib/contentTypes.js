export const PLATFORMS = {
  blog: {
    id: 'blog',
    label: 'Blog Post',
    color: 'indigo',
    bgClass: 'bg-indigo-100 text-indigo-800',
    dotClass: 'bg-indigo-500',
    description: 'Long-form article, SEO-optimised, 800–1,200 words',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    color: 'pink',
    bgClass: 'bg-pink-100 text-pink-800',
    dotClass: 'bg-pink-500',
    description: 'Caption + hashtags, 150–300 words',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    color: 'slate',
    bgClass: 'bg-slate-100 text-slate-800',
    dotClass: 'bg-slate-700',
    description: 'Video script, 60–90 second read',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'blue',
    bgClass: 'bg-blue-100 text-blue-800',
    dotClass: 'bg-blue-600',
    description: 'Professional post / article, 150–300 words',
  },
  twitter: {
    id: 'twitter',
    label: 'Twitter / X',
    color: 'sky',
    bgClass: 'bg-sky-100 text-sky-800',
    dotClass: 'bg-sky-500',
    description: 'Thread of 5–10 tweets',
  },
  facebook_ad: {
    id: 'facebook_ad',
    label: 'Facebook Ad',
    color: 'violet',
    bgClass: 'bg-violet-100 text-violet-800',
    dotClass: 'bg-violet-500',
    description: 'Ad copy: headline + body + CTA, 50–150 words',
  },
  google_ad: {
    id: 'google_ad',
    label: 'Google Ad',
    color: 'green',
    bgClass: 'bg-green-100 text-green-800',
    dotClass: 'bg-green-600',
    description: 'Responsive search ad: headlines + descriptions',
  },
}

export const MODELS = {
  claude: {
    id: 'claude',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    bgClass: 'bg-purple-100 text-purple-800',
  },
  gpt4: {
    id: 'gpt4',
    label: 'GPT-4o',
    provider: 'OpenAI',
    bgClass: 'bg-emerald-100 text-emerald-800',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini 1.5 Pro',
    provider: 'Google',
    bgClass: 'bg-blue-100 text-blue-800',
  },
}

export const STATUS = {
  pending: {
    label: 'Pending',
    bgClass: 'bg-gray-100 text-gray-600',
  },
  generated: {
    label: 'Generated',
    bgClass: 'bg-amber-100 text-amber-700',
  },
  approved: {
    label: 'Approved',
    bgClass: 'bg-emerald-100 text-emerald-700',
  },
  exported: {
    label: 'Exported',
    bgClass: 'bg-indigo-100 text-indigo-700',
  },
}

// Weekly rotation: key = day-of-week (0=Sun..6=Sat)
export const WEEKLY_SCHEDULE = {
  0: [],                             // Sunday  – rest
  1: ['linkedin', 'twitter'],        // Monday
  2: ['blog', 'twitter'],            // Tuesday
  3: ['instagram', 'twitter'],       // Wednesday
  4: ['linkedin', 'twitter'],        // Thursday
  5: ['tiktok', 'instagram'],        // Friday
  6: ['facebook_ad', 'google_ad'],   // Saturday – ads
}
