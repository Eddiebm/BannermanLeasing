import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday, parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PLATFORMS } from '../lib/contentTypes.js'

export default function CalendarGrid({ byDate, onDayClick }) {
  const [current, setCurrent] = useState(new Date())

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="card overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <button
          onClick={() => setCurrent(subMonths(current, 1))}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {format(current, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrent(addMonths(current, 1))}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const items = byDate[key] ?? []
          const inMonth = isSameMonth(day, current)
          const today = isToday(day)

          return (
            <button
              key={key}
              onClick={() => onDayClick(day, items)}
              className={`min-h-[80px] p-1.5 text-left border-b border-r border-gray-100 transition-colors ${
                inMonth ? 'bg-white hover:bg-indigo-50' : 'bg-gray-50 opacity-50'
              }`}
            >
              <span
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  today ? 'bg-indigo-600 text-white' : 'text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {items.slice(0, 4).map((item) => {
                  const cfg = PLATFORMS[item.platform]
                  return cfg ? (
                    <span
                      key={item.id}
                      className={`w-2 h-2 rounded-full ${cfg.dotClass}`}
                      title={`${cfg.label} – ${item.status}`}
                    />
                  ) : null
                })}
                {items.length > 4 && (
                  <span className="text-xs text-gray-400">+{items.length - 4}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
