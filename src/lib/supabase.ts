import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Vérification de la configuration Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Configuration Supabase manquante. Certaines fonctionnalités peuvent ne pas fonctionner.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        headers: {
          'X-Client-Info': 'consortium-app'
        }
      }
    })
  : null

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