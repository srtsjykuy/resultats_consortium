import { useState, useEffect, useCallback } from 'react'
import { supabase, testSupabaseConnection, type CountdownSettings } from '../lib/supabase'

interface UseCountdownReturn {
  settings: CountdownSettings | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateSettings: (updates: Partial<CountdownSettings>) => Promise<CountdownSettings | null>
  createSettings: (newSettings: Omit<CountdownSettings, 'id' | 'created_at' | 'updated_at'>) => Promise<CountdownSettings | null>
  resetCountdown: (hours?: number) => Promise<CountdownSettings | null>
  isConnected: boolean
}

export function useCountdown(): UseCountdownReturn {
  const [settings, setSettings] = useState<CountdownSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Test de connexion
  const checkConnection = useCallback(async () => {
    const result = await testSupabaseConnection()
    setIsConnected(result.success)
    if (!result.success) {
      setError(result.error || 'Erreur de connexion')
    }
    return result.success
  }, [])

  // Récupération des paramètres
  const fetchCountdownSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Vérifier la connexion d'abord
      const connected = await checkConnection()
      if (!connected || !supabase) {
        return
      }
      
      // Utiliser la vue active_countdown pour plus d'efficacité
      const { data, error: supabaseError } = await supabase
        .from('active_countdown')
        .select('*')
        .single()

      if (supabaseError) {
        // Si aucun paramètre actif, essayer de créer des paramètres par défaut
        if (supabaseError.code === 'PGRST116') {
          await createDefaultSettings()
          return
        }
        throw supabaseError
      }
      
      setSettings(data)
    } catch (err) {
      console.error('Error fetching countdown settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de récupération des paramètres'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [checkConnection])

  // Création des paramètres par défaut
  const createDefaultSettings = useCallback(async (): Promise<CountdownSettings | null> => {
    try {
      if (!supabase) return null
      
      const defaultSettings = {
        target_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        title: 'LES RÉSULTATS SERONT DISPONIBLES DANS',
        description: 'Les résultats exceptionnels de nos membres d\'élite seront bientôt révélés.',
        created_by: 'system'
      }
      
      const { data, error: supabaseError } = await supabase
        .from('countdown_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (supabaseError) {
        throw supabaseError
      }

      setSettings(data)
      return data
    } catch (err) {
      console.error('Error creating default settings:', err)
      return null
    }
  }, [])

  // Mise à jour des paramètres
  const updateSettings = useCallback(async (updates: Partial<CountdownSettings>): Promise<CountdownSettings | null> => {
    try {
      setError(null)
      
      if (!supabase || !isConnected) {
        throw new Error('Supabase n\'est pas connecté')
      }
      
      if (!settings?.id) {
        throw new Error('Aucun paramètre à mettre à jour')
      }

      const { data, error: supabaseError } = await supabase
        .from('countdown_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single()

      if (supabaseError) {
        throw supabaseError
      }

      setSettings(data)
      return data
    } catch (err) {
      console.error('Error updating countdown settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour'
      setError(errorMessage)
      return null
    }
  }, [settings, isConnected])

  // Création de nouveaux paramètres
  const createSettings = useCallback(async (newSettings: Omit<CountdownSettings, 'id' | 'created_at' | 'updated_at'>): Promise<CountdownSettings | null> => {
    try {
      setError(null)
      
      if (!supabase || !isConnected) {
        throw new Error('Supabase n\'est pas connecté')
      }
      
      const { data, error: supabaseError } = await supabase
        .from('countdown_settings')
        .insert(newSettings)
        .select()
        .single()

      if (supabaseError) {
        throw supabaseError
      }

      setSettings(data)
      return data
    } catch (err) {
      console.error('Error creating countdown settings:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de création'
      setError(errorMessage)
      return null
    }
  }, [isConnected])

  // Réinitialisation du compte à rebours
  const resetCountdown = useCallback(async (hours: number = 24): Promise<CountdownSettings | null> => {
    try {
      setError(null)
      
      if (!supabase || !isConnected) {
        throw new Error('Supabase n\'est pas connecté')
      }
      
      const { data, error: supabaseError } = await supabase
        .rpc('reset_countdown', { hours_from_now: hours })

      if (supabaseError) {
        throw supabaseError
      }

      setSettings(data)
      return data
    } catch (err) {
      console.error('Error resetting countdown:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur de réinitialisation'
      setError(errorMessage)
      return null
    }
  }, [isConnected])

  // Effet pour charger les paramètres au montage
  useEffect(() => {
    fetchCountdownSettings()
  }, [fetchCountdownSettings])

  // Abonnement aux changements en temps réel
  useEffect(() => {
    if (!supabase || !isConnected) return

    const subscription = supabase
      .channel('countdown_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'countdown_settings'
        },
        (payload) => {
          console.log('Countdown settings changed:', payload)
          fetchCountdownSettings()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isConnected, fetchCountdownSettings])

  return {
    settings,
    loading,
    error,
    refetch: fetchCountdownSettings,
    updateSettings,
    createSettings,
    resetCountdown,
    isConnected
  }
}