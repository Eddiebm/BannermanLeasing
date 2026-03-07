import { PLATFORMS } from '../lib/contentTypes.js'

export default function PlatformBadge({ platform, className = '' }) {
  const cfg = PLATFORMS[platform]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  )
}
