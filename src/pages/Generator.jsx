import GeneratorPanel from '../components/GeneratorPanel.jsx'
import { useContent } from '../hooks/useContent.js'

export default function Generator() {
  const { addOrUpdateItem } = useContent()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Content Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a platform and AI model, provide a topic and brief, then generate and save to the queue.
        </p>
      </div>
      <GeneratorPanel onCreated={addOrUpdateItem} />
      <div className="card p-5 bg-amber-50 border-amber-200">
        <h3 className="text-sm font-semibold text-amber-800 mb-1">🔑 API keys</h3>
        <p className="text-xs text-amber-700">
          API keys are stored as encrypted environment variables in Cloudflare Pages — they never
          reach the browser. Set <code>ANTHROPIC_API_KEY</code>, <code>OPENAI_API_KEY</code>, and{' '}
          <code>GOOGLE_AI_API_KEY</code> in your Cloudflare dashboard.
        </p>
      </div>
    </div>
  )
}
