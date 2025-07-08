import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type CountdownSettings = Database['public']['Tables']['countdown_settings']['Row']

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function useCountdown() {
  const [countdownSettings, setCountdownSettings] = useState<CountdownSettings | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isCountdownFinished, setIsCountdownFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch countdown settings from database
  const fetchCountdownSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('countdown_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching countdown settings:', error)
        setError(error.message)
        return
      }

      setCountdownSettings(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching countdown settings:', err)
      setError('Failed to fetch countdown settings')
    } finally {
      setLoading(false)
    }
  }

  // Update countdown settings in database
  const updateCountdownSettings = async (updates: Partial<CountdownSettings>) => {
    if (!countdownSettings) return

    try {
      const { data, error } = await supabase
        .from('countdown_settings')
        .update(updates)
        .eq('id', countdownSettings.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating countdown settings:', error)
        setError(error.message)
        return
      }

      setCountdownSettings(data)
      setError(null)
    } catch (err) {
      console.error('Error updating countdown settings:', err)
      setError('Failed to update countdown settings')
    }
  }

  // Calculate time remaining
  useEffect(() => {
    if (!countdownSettings || !countdownSettings.is_active) {
      setIsCountdownFinished(true)
      return
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const target = new Date(countdownSettings.target_date).getTime()
      const difference = target - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeRemaining({ days, hours, minutes, seconds })
        setIsCountdownFinished(false)
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setIsCountdownFinished(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [countdownSettings])

  // Fetch settings on mount
  useEffect(() => {
    fetchCountdownSettings()
  }, [])

  // Subscribe to real-time changes
  useEffect(() => {
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
  }, [])

  return {
    countdownSettings,
    timeRemaining,
    isCountdownFinished,
    loading,
    error,
    updateCountdownSettings,
    fetchCountdownSettings
  }
}