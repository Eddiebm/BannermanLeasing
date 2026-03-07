import { format, parseISO } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import PlatformBadge from './PlatformBadge.jsx'

export default function ContentCard({ item, onSelect, onDelete }) {
  return (
    <div
      className="card p-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onSelect(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PlatformBadge platform={item.platform} />
            <StatusBadge status={item.status} />
          </div>
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.topic || <span className="text-gray-400 italic">No topic set</span>}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {format(parseISO(item.date), 'EEE, d MMM yyyy')}
          </p>
          {item.content && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              {typeof item.content === 'string'
                ? item.content.slice(0, 120)
                : item.content.body?.slice(0, 120)}
              …
            </p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
