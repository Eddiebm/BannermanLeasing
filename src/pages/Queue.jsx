import { useState, useMemo } from 'react'
import { Download, Search, Filter } from 'lucide-react'
import { useContent } from '../hooks/useContent.js'
import { PLATFORMS, STATUS } from '../lib/contentTypes.js'
import ContentCard from '../components/ContentCard.jsx'
import ContentDetail from '../components/ContentDetail.jsx'
import ExportModal from '../components/ExportModal.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Queue() {
  const { items, addOrUpdateItem, removeItem } = useContent()
  const [activeItem, setActiveItem] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        if (filterPlatform && i.platform !== filterPlatform) return false
        if (filterStatus && i.status !== filterStatus) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            i.topic?.toLowerCase().includes(q) ||
            i.brief?.toLowerCase().includes(q) ||
            i.date.includes(q)
          )
        }
        return true
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [items, filterPlatform, filterStatus, search])

  async function handleSave(item) {
    await addOrUpdateItem(item)
    setActiveItem(null)
  }

  async function handleDelete(id) {
    await removeItem(id)
    setActiveItem(null)
  }

  function handleExportClose(action, ids) {
    setShowExport(false)
    if (action === 'exported' && ids) {
      ids.forEach((id) => {
        const item = items.find((i) => i.id === id)
        if (item) addOrUpdateItem({ ...item, status: 'exported' })
      })
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by topic, brief, date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input py-2 text-sm" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="">All platforms</option>
            {Object.values(PLATFORMS).map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select className="input py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            {Object.keys(STATUS).map((s) => (
              <option key={s} value={s}>{STATUS[s].label}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowExport(true)} className="btn-secondary" disabled={!filtered.length}>
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} items</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No content found"
          description="Adjust your filters or generate a 365-day schedule from the Calendar page."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onSelect={setActiveItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {activeItem && (
        <ContentDetail
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {showExport && (
        <ExportModal items={filtered} onClose={handleExportClose} />
      )}
    </div>
  )
}
