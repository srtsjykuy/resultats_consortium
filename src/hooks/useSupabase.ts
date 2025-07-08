import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type CountdownSettings = Database['public']['Tables']['countdown_settings']['Row']

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('countdown_settings')
        .select('id')
        .limit(1)

      if (error) {
        setError(error.message)
        setIsConnected(false)
      } else {
        setIsConnected(true)
        setError(null)
      }
    } catch (err) {
      setError('Failed to connect to Supabase')
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const getCountdownSettings = async (): Promise<CountdownSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('countdown_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching countdown settings:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Error fetching countdown settings:', err)
      return null
    }
  }

  const updateCountdownSettings = async (settings: Partial<CountdownSettings>) => {
    try {
      const { data, error } = await supabase
        .from('countdown_settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating countdown settings:', error)
        return null
      }

      return data
    } catch (err) {
      console.error('Error updating countdown settings:', err)
      return null
    }
  }

  return {
    isConnected,
    loading,
    error,
    checkConnection,
    getCountdownSettings,
    updateCountdownSettings,
    supabase
  }
}