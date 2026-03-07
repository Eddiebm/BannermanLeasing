import { NavLink } from 'react-router-dom'
import { CalendarDays, List, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/queue', label: 'Queue', Icon: List },
  { to: '/generator', label: 'Generator', Icon: Sparkles },
]

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <div>
              <span className="font-semibold text-gray-900 text-sm">Bannerman Leasing</span>
              <span className="hidden sm:inline text-gray-400 text-sm"> · Content Studio</span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
