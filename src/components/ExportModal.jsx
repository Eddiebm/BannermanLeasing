import { X, FileJson, FileText } from 'lucide-react'
import { exportAsCSV, exportAsJSON } from '../lib/exportUtils.js'

export default function ExportModal({ items, onClose }) {
  const approved = items.filter((i) => i.status === 'approved')
  const all = items

  function doExport(subset, format) {
    const filename = `bannerman-content-${new Date().toISOString().slice(0, 10)}.${format}`
    if (format === 'csv') exportAsCSV(subset, filename)
    else exportAsJSON(subset, filename)
    // Mark as exported
    onClose('exported', subset.map((i) => i.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export Content</h2>
          <button onClick={() => onClose(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Export content items to CSV or JSON. Approved-only or all items.
        </p>

        <div className="space-y-3">
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              Approved only ({approved.length} items)
            </p>
            <div className="flex gap-2">
              <button onClick={() => doExport(approved, 'csv')} disabled={!approved.length} className="btn-secondary text-xs flex-1 justify-center">
                <FileText className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => doExport(approved, 'json')} disabled={!approved.length} className="btn-secondary text-xs flex-1 justify-center">
                <FileJson className="w-3.5 h-3.5" /> JSON
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-900 mb-3">
              All items ({all.length} items)
            </p>
            <div className="flex gap-2">
              <button onClick={() => doExport(all, 'csv')} disabled={!all.length} className="btn-secondary text-xs flex-1 justify-center">
                <FileText className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => doExport(all, 'json')} disabled={!all.length} className="btn-secondary text-xs flex-1 justify-center">
                <FileJson className="w-3.5 h-3.5" /> JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
