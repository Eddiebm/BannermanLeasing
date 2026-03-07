/**
 * Export an array of content items to CSV string.
 */
export function toCSV(items) {
  const headers = ['id', 'date', 'platform', 'topic', 'brief', 'status', 'model', 'content', 'createdAt']
  const escape = (val) => {
    if (val == null) return ''
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    return `"${str.replace(/"/g, '""')}"`
  }
  const rows = items.map((item) =>
    headers.map((h) => escape(h === 'content' ? item.content?.body ?? item.content : item[h])).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

/**
 * Export an array of content items to a JSON string.
 */
export function toJSON(items) {
  return JSON.stringify(items, null, 2)
}

/**
 * Trigger a browser file download.
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportAsCSV(items, filename = 'content-export.csv') {
  downloadFile(toCSV(items), filename, 'text/csv')
}

export function exportAsJSON(items, filename = 'content-export.json') {
  downloadFile(toJSON(items), filename, 'application/json')
}
