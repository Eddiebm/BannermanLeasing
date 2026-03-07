import { useState } from 'react'
import { X, CheckCircle, Trash2, Loader2 } from 'lucide-react'
import { PLATFORMS, MODELS } from '../lib/contentTypes.js'
import { useGenerate } from '../hooks/useGenerate.js'
import StatusBadge from './StatusBadge.jsx'
import PlatformBadge from './PlatformBadge.jsx'

export default function ContentDetail({ item, onClose, onSave, onDelete }) {
  const [local, setLocal] = useState(item)
  const { generate, loading, error } = useGenerate()

  function update(field, value) {
    setLocal((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGenerate() {
    const text = await generate({
      model: local.model,
      platform: local.platform,
      topic: local.topic,
      brief: local.brief,
    })
    if (text) {
      const updated = {
        ...local,
        content: { body: text },
        status: 'generated',
        updatedAt: new Date().toISOString(),
      }
      setLocal(updated)
      onSave(updated)
    }
  }

  function handleApprove() {
    const updated = { ...local, status: 'approved', updatedAt: new Date().toISOString() }
    setLocal(updated)
    onSave(updated)
  }

  function handleSave() {
    onSave({ ...local, updatedAt: new Date().toISOString() })
  }

  const bodyText = typeof local.content === 'string'
    ? local.content
    : local.content?.body ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden sm:rounded-xl rounded-t-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <PlatformBadge platform={local.platform} />
            <StatusBadge status={local.status} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Platform + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Platform</label>
              <select
                className="input"
                value={local.platform}
                onChange={(e) => update('platform', e.target.value)}
              >
                {Object.values(PLATFORMS).map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">AI Model</label>
              <select
                className="input"
                value={local.model}
                onChange={(e) => update('model', e.target.value)}
              >
                {Object.values(MODELS).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="label">Topic / Headline</label>
            <input
              className="input"
              value={local.topic}
              onChange={(e) => update('topic', e.target.value)}
              placeholder="e.g. Benefits of equipment leasing for SMEs"
            />
          </div>

          {/* Brief */}
          <div>
            <label className="label">Brief / Context</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={local.brief}
              onChange={(e) => update('brief', e.target.value)}
              placeholder="Additional context, key messages, or specific requirements…"
            />
          </div>

          {/* Generated content */}
          {bodyText && (
            <div>
              <label className="label">Generated Content</label>
              <textarea
                className="input font-mono text-xs resize-none"
                rows={12}
                value={bodyText}
                onChange={(e) =>
                  update('content', { ...local.content, body: e.target.value })
                }
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary flex-1 sm:flex-none justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Generating…' : bodyText ? 'Re-generate' : 'Generate'}
          </button>
          {local.status === 'generated' && (
            <button onClick={handleApprove} className="btn bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 flex-1 sm:flex-none justify-center">
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
          <button onClick={handleSave} className="btn-secondary flex-1 sm:flex-none justify-center">
            Save
          </button>
          <button
            onClick={() => onDelete(local.id)}
            className="ml-auto btn-danger flex-none"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
