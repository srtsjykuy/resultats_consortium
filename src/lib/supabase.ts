import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  })
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

export type Database = {
  public: {
    Tables: {
      countdown_settings: {
        Row: {
          id: string
          target_date: string
          is_active: boolean
          title: string
          description: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          target_date?: string
          is_active?: boolean
          title?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          target_date?: string
          is_active?: boolean
          title?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
    }
  }
}