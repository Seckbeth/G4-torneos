import { createClient } from '@supabase/supabase-js'

// Configuración por defecto (se rellena con tu clave anon de Supabase)
// Estos valores se sobrescriben desde index.html si están definidos globalmente
const SUPABASE_URL = (typeof window !== 'undefined' && (window as any).__SUPABASE_URL__) || 'https://vrrqrunsgphlkmrxtbcl.supabase.co'
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && (window as any).__SUPABASE_ANON_KEY__) || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper para escuchar cambios en tiempo real
export function subscribeToTable<T>(
  table: string,
  filter: string | null,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: T | null; old: T | null }) => void
) {
  let channel = supabase.channel(`db-${table}`)

  if (filter) {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      (payload: any) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
        })
      }
    )
  } else {
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload: any) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
        })
      }
    )
  }

  channel.subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

export default supabase