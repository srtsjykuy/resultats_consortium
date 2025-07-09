import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type CountdownSettings = Database['public']['Tables']['countdown_settings']['Row']

export function useCountdown() {
  const [settings, setSettings] = useState<CountdownSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCountdownSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if Supabase is configured
      if (!supabase) {
        throw new Error('Supabase n\'est pas configuré. Veuillez vérifier vos variables d\'environnement.')
      }
      
      const { data, error: supabaseError } = await supabase
        .from('countdown_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      if (supabaseError) {
        throw supabaseError
      }
      
      if (data && data.length > 0) {
        setSettings(data[0])
      } else {
        // Créer des paramètres par défaut si aucun n'existe
        await createDefaultSettings()
      }
    } catch (err) {
      console.error('Error fetching countdown settings:', err)
      setError(err instanceof Error ? err.message : 'Erreur de connexion à la base de données')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultSettings = async () => {
    try {
      if (!supabase) return
      
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
    } catch (err) {
      console.error('Error creating default settings:', err)
    }
  }

  const updateCountdownSettings = async (updates: Partial<CountdownSettings>) => {
    try {
      setError(null)
      
      if (!supabase) {
        throw new Error('Supabase n\'est pas configuré')
      }
      
      if (!settings?.id) {
        throw new Error('No settings to update')
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
      setError(err instanceof Error ? err.message : 'Failed to update countdown settings')
      throw err
    }
  }

  const createCountdownSettings = async (newSettings: Omit<CountdownSettings, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)
      
      if (!supabase) {
        throw new Error('Supabase n\'est pas configuré')
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
      setError(err instanceof Error ? err.message : 'Failed to create countdown settings')
      throw err
    }
  }

  useEffect(() => {
    fetchCountdownSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    refetch: fetchCountdownSettings,
    updateSettings: updateCountdownSettings,
    createSettings: createCountdownSettings,
    createDefaultSettings
  }
}