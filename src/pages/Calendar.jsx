import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Download, Zap } from 'lucide-react'
import { useContent } from '../hooks/useContent.js'
import { generateYearSchedule, makeItem } from '../lib/scheduleGenerator.js'
import CalendarGrid from '../components/CalendarGrid.jsx'
import ContentCard from '../components/ContentCard.jsx'
import ContentDetail from '../components/ContentDetail.jsx'
import ExportModal from '../components/ExportModal.jsx'
import EmptyState from '../components/EmptyState.jsx'

export default function Calendar() {
  const { items, byDate, stats, addOrUpdateItem, removeItem, setAllItems } = useContent()
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayItems, setDayItems] = useState([])
  const [activeItem, setActiveItem] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [generating, setGenerating] = useState(false)

  function handleDayClick(day, its) {
    setSelectedDay(day)
    setDayItems(its)
  }

  function handleSelectItem(item) {
    setActiveItem(item)
  }

  async function handleSave(item) {
    await addOrUpdateItem(item)
    setDayItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
    setActiveItem(null)
  }

  async function handleDelete(id) {
    await removeItem(id)
    setDayItems((prev) => prev.filter((i) => i.id !== id))
    setActiveItem(null)
  }

  function handleAddItem() {
    if (!selectedDay) return
    const item = makeItem({ date: format(selectedDay, 'yyyy-MM-dd'), platform: 'blog' })
    setActiveItem(item)
  }

  async function handleGenerate365() {
    if (!confirm(`This will replace ALL ${items.length} existing items with a fresh 365-day schedule. Continue?`)) return
    setGenerating(true)
    const schedule = generateYearSchedule(new Date().getFullYear())
    setAllItems(schedule)
    setSelectedDay(null)
    setGenerating(false)
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
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
          { label: 'Exported', value: stats.exported, color: 'text-indigo-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleGenerate365}
          disabled={generating}
          className="btn-primary"
        >
          <Zap className="w-4 h-4" />
          {generating ? 'Building…' : 'Generate 365-Day Schedule'}
        </button>
        <button onClick={() => setShowExport(true)} className="btn-secondary" disabled={!items.length}>
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <CalendarGrid byDate={byDate} onDayClick={handleDayClick} />
        </div>

        {/* Day panel */}
        <div className="space-y-4">
          {selectedDay ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  {format(selectedDay, 'EEE, d MMM yyyy')}
                </h2>
                <button onClick={handleAddItem} className="btn-primary text-xs py-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {dayItems.length === 0 ? (
                <EmptyState icon="✏️" title="No content yet" description="Add a content item for this day." />
              ) : (
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="👆" title="Select a day" description="Click any day on the calendar to view or add content." />
          )}
        </div>
      </div>

      {/* Detail modal */}
      {activeItem && (
        <ContentDetail
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Export modal */}
      {showExport && (
        <ExportModal items={items} onClose={handleExportClose} />
      )}
    </div>
  )
}
