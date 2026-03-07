import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { PLATFORMS, MODELS } from '../lib/contentTypes.js'
import { useGenerate } from '../hooks/useGenerate.js'
import { makeItem } from '../lib/scheduleGenerator.js'
import { format } from 'date-fns'

export default function GeneratorPanel({ onCreated }) {
  const [platform, setPlatform] = useState('blog')
  const [model, setModel] = useState('claude')
  const [topic, setTopic] = useState('')
  const [brief, setBrief] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [result, setResult] = useState(null)
  const { generate, loading, error } = useGenerate()

  async function handleGenerate() {
    const text = await generate({ model, platform, topic, brief })
    if (text) setResult(text)
  }

  function handleSave() {
    if (!result) return
    const item = makeItem({ date, platform, topic, brief })
    const final = {
      ...item,
      model,
      content: { body: result },
      status: 'generated',
    }
    onCreated(final)
    setResult(null)
    setTopic('')
    setBrief('')
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Platform</label>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {Object.values(PLATFORMS).map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">{PLATFORMS[platform]?.description}</p>
        </div>
        <div>
          <label className="label">AI Model</label>
          <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
            {Object.values(MODELS).map((m) => (
              <option key={m.id} value={m.id}>{m.label} – {m.provider}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Scheduled Date</label>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <label className="label">Topic / Headline</label>
        <input
          className="input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Why flexible leasing beats outright purchase in 2025"
        />
      </div>

      <div>
        <label className="label">Brief / Context</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Key messages, target audience, specific angles, product features to highlight…"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <div>
          <label className="label">Generated Content</label>
          <textarea
            className="input font-mono text-xs resize-none"
            rows={14}
            value={result}
            onChange={(e) => setResult(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleGenerate} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Generating…' : result ? 'Re-generate' : 'Generate'}
        </button>
        {result && (
          <button onClick={handleSave} className="btn-secondary">
            Add to Queue
          </button>
        )}
      </div>
    </div>
  )
}
