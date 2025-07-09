import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface CountdownSettings {
  id: string
  target_date: string
  is_active: boolean
  title: string
  description: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

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
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (supabaseError) {
        // If no data found, that's not necessarily an error
        if (supabaseError.code === 'PGRST116') {
          console.log('No active countdown settings found')
          setSettings(null)
        } else {
          throw supabaseError
        }
      } else {
        setSettings(data)
      }
    } catch (err) {
      console.error('Error fetching countdown settings:', err)
      setError(err instanceof Error ? err.message : 'Erreur de connexion à la base de données')
    } finally {
      setLoading(false)
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
    createSettings: createCountdownSettings
  }
}