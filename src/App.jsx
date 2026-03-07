import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Calendar from './pages/Calendar.jsx'
import Queue from './pages/Queue.jsx'
import Generator from './pages/Generator.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/generator" element={<Generator />} />
        </Routes>
      </main>
    </div>
  )
}
