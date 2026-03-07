import { MODELS } from '../lib/contentTypes.js'

export default function ModelBadge({ model, className = '' }) {
  const cfg = MODELS[model]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgClass} ${className}`}>
      {cfg.label}
    </span>
  )
}
