import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { fetchItems, upsertItem, deleteItem, isSupabaseEnabled } from '../lib/supabase.js'

const STORAGE_KEY = 'bl_content_items'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':
      return action.items
    case 'UPSERT': {
      const exists = state.find((i) => i.id === action.item.id)
      if (exists) {
        return state.map((i) => (i.id === action.item.id ? action.item : i))
      }
      return [...state, action.item]
    }
    case 'DELETE':
      return state.filter((i) => i.id !== action.id)
    default:
      return state
  }
}

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], load)

  // Sync to localStorage whenever items change
  useEffect(() => {
    save(items)
  }, [items])

  // Optionally sync from Supabase on mount
  useEffect(() => {
    if (!isSupabaseEnabled) return
    fetchItems()
      .then((data) => {
        if (data) dispatch({ type: 'SET_ALL', items: data })
      })
      .catch(console.error)
  }, [])

  const addOrUpdateItem = useCallback(async (item) => {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    dispatch({ type: 'UPSERT', item: updated })
    if (isSupabaseEnabled) {
      await upsertItem(updated).catch(console.error)
    }
  }, [])

  const removeItem = useCallback(async (id) => {
    dispatch({ type: 'DELETE', id })
    if (isSupabaseEnabled) {
      await deleteItem(id).catch(console.error)
    }
  }, [])

  const setAllItems = useCallback((items) => {
    dispatch({ type: 'SET_ALL', items })
  }, [])

  return (
    <ContentContext.Provider value={{ items, addOrUpdateItem, removeItem, setAllItems }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContentContext() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContentContext must be used within ContentProvider')
  return ctx
}
