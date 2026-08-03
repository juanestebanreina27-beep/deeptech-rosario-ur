import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anon!)
  : null

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'postulante' | 'evaluador' | 'admin'
  consent_at: string | null
  privacy_version: string | null
}
