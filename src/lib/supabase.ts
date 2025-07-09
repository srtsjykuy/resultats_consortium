import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérifier si les variables d'environnement sont configurées correctement
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.includes('supabase.co')
  } catch {
    return false
  }
}

const isValidKey = (key: string): boolean => {
  return key && key.length > 20 && !key.includes('votre_')
}

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

// Créer le client Supabase avec vérification stricte
export const supabase = (
  supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) && 
  isValidKey(supabaseAnonKey)
) ? createClient(supabaseUrl, supabaseAnonKey, supabaseConfig) : null

// Fonction de diagnostic de configuration
export const getSupabaseConfigStatus = (): { 
  configured: boolean; 
  issues: string[]; 
  url?: string; 
  keyLength?: number 
} => {
  const issues: string[] = []
  
  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL manquant dans le fichier .env')
  } else if (!isValidUrl(supabaseUrl)) {
    issues.push('VITE_SUPABASE_URL invalide (doit être une URL Supabase valide)')
  }
  
  if (!supabaseAnonKey) {
    issues.push('VITE_SUPABASE_ANON_KEY manquant dans le fichier .env')
  } else if (!isValidKey(supabaseAnonKey)) {
    issues.push('VITE_SUPABASE_ANON_KEY invalide (vérifiez que ce n\'est pas une valeur placeholder)')
  }
  
  return {
    configured: issues.length === 0,
    issues,
    url: supabaseUrl,
    keyLength: supabaseAnonKey?.length
  }
}

// Fonction de test de connexion améliorée
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  const configStatus = getSupabaseConfigStatus()
  
  if (!configStatus.configured) {
    return { 
      success: false, 
      error: `Configuration Supabase incorrecte:\n${configStatus.issues.join('\n')}` 
    }
  }

  if (!supabase) {
    return { 
      success: false, 
      error: 'Client Supabase non initialisé. Vérifiez votre configuration.' 
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