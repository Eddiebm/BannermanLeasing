import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export const isSupabaseEnabled = Boolean(supabase)

// --- Content item CRUD helpers ---

export async function fetchItems() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function upsertItem(item) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('content_items')
    .upsert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItem(id) {
  if (!supabase) return null
  const { error } = await supabase.from('content_items').delete().eq('id', id)
  if (error) throw error
}
