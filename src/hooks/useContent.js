import { useMemo } from 'react'
import { useContentContext } from './useContentContext.js'

export function useContent() {
  const { items, addOrUpdateItem, removeItem, setAllItems } = useContentContext()

  const byDate = useMemo(() => {
    const map = {}
    items.forEach((item) => {
      if (!map[item.date]) map[item.date] = []
      map[item.date].push(item)
    })
    return map
  }, [items])

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    generated: items.filter((i) => i.status === 'generated').length,
    approved: items.filter((i) => i.status === 'approved').length,
    exported: items.filter((i) => i.status === 'exported').length,
  }), [items])

  return { items, byDate, stats, addOrUpdateItem, removeItem, setAllItems }
}
