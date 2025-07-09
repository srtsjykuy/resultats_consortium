import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuration robuste avec gestion d'erreurs
const supabaseConfig = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'consortium-app'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// Créer le client Supabase avec vérification
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, supabaseConfig)
  : null

// Fonction de test de connexion
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return { 
      success: false, 
      error: 'Configuration Supabase manquante. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.' 
    }
  }

  try {
    // Test simple avec timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secondes timeout

    const { error } = await supabase
      .from('countdown_settings')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal)
    
    clearTimeout(timeoutId)
    
    if (error) {
      return { success: false, error: `Erreur Supabase: ${error.message}` }
    }
    
    return { success: true }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Timeout de connexion à Supabase' }
      }
      return { success: false, error: `Erreur de connexion: ${err.message}` }
    }
    return { success: false, error: 'Erreur de connexion inconnue' }
  }
}

// Types TypeScript pour la base de données
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
    Views: {
      active_countdown: {
        Row: {
          id: string
          target_date: string
          is_active: boolean
          title: string
          description: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          seconds_remaining: number
        }
      }
    }
    Functions: {
      reset_countdown: {
        Args: {
          hours_from_now?: number
        }
        Returns: Database['public']['Tables']['countdown_settings']['Row']
      }
    }
  }
}

// Export du type pour les paramètres de compte à rebours
export type CountdownSettings = Database['public']['Tables']['countdown_settings']['Row']