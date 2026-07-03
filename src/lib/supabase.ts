import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[tokiq] Supabase environment variables tidak ditemukan. ' +
    'Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local'
  )
}

// Singleton Supabase client — gunakan ini di semua service dan hook
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
)
