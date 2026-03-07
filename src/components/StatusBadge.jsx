import { STATUS } from '../lib/contentTypes.js'

export default function StatusBadge({ status, className = '' }) {
  const cfg = STATUS[status] ?? STATUS.pending
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgClass} ${className}`}>
      {cfg.label}
    </span>
  )
}
