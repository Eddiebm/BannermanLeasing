import { useContext } from 'react'
import { ContentContext } from '../context/ContentContext.jsx'

export function useContentContext() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContentContext must be used within ContentProvider')
  return ctx
}
