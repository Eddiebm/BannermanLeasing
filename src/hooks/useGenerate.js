import { useState } from 'react'
import { buildSystemPrompt, buildUserPrompt } from '../lib/prompts.js'

export function useGenerate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generate({ model, platform, topic, brief }) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          system: buildSystemPrompt(),
          prompt: buildUserPrompt({ platform, topic, brief }),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Generation failed')
      }
      const data = await res.json()
      return data.content
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generate, loading, error }
}
