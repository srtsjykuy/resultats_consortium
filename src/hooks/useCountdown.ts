import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CountdownSettings {
  id?: string;
  target_date: string;
  is_active: boolean;
  title: string;
  description?: string;
  updated_at?: string;
}

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useCountdown = () => {
  const [countdownSettings, setCountdownSettings] = useState<CountdownSettings>({
    target_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    title: 'LES RÉSULTATS SERONT DISPONIBLES DANS',
    description: 'Les résultats exceptionnels de nos membres d\'élite seront bientôt révélés.'
  });
  
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ 
    days: 0, hours: 0, minutes: 0, seconds: 0 
  });
  
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les paramètres du chrono depuis la base de données
  const loadCountdownSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('countdown_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Erreur lors du chargement du chrono:', fetchError);
        setError('Erreur lors du chargement du chrono');
        return;
      }

      if (data) {
        setCountdownSettings({
          id: data.id,
          target_date: data.target_date,
          is_active: data.is_active,
          title: data.title,
          description: data.description,
          updated_at: data.updated_at
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion à la base de données');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les paramètres du chrono
  const saveCountdownSettings = async (newSettings: Partial<CountdownSettings>) => {
    try {
      setError(null);

      const updateData = {
        target_date: newSettings.target_date || countdownSettings.target_date,
        is_active: newSettings.is_active !== undefined ? newSettings.is_active : countdownSettings.is_active,
        title: newSettings.title || countdownSettings.title,
        description: newSettings.description || countdownSettings.description
      };

      let result;

      if (countdownSettings.id) {
        // Mettre à jour l'enregistrement existant
        result = await supabase
          .from('countdown_settings')
          .update(updateData)
          .eq('id', countdownSettings.id)
          .select()
          .single();
      } else {
        // Créer un nouvel enregistrement
        result = await supabase
          .from('countdown_settings')
          .insert(updateData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erreur lors de la sauvegarde:', result.error);
        setError('Erreur lors de la sauvegarde');
        return false;
      }

      if (result.data) {
        setCountdownSettings({
          id: result.data.id,
          target_date: result.data.target_date,
          is_active: result.data.is_active,
          title: result.data.title,
          description: result.data.description,
          updated_at: result.data.updated_at
        });
      }

      return true;
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur de connexion à la base de données');
      return false;
    }
  };

  // Calculer le temps restant
  const calculateTimeRemaining = () => {
    if (!countdownSettings.is_active) {
      setIsCountdownFinished(true);
      return;
    }

    const now = new Date().getTime();
    const target = new Date(countdownSettings.target_date).getTime();
    const difference = target - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
      setIsCountdownFinished(false);
    } else {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsCountdownFinished(true);
    }
  };

  // Fonction pour déterminer la couleur du chrono
  const getCountdownTextColor = () => {
    const totalDays = timeRemaining.days;
    if (totalDays >= 4) {
      return 'text-yellow-400'; // Jaune pour 4+ jours
    } else {
      return 'text-red-500'; // Rouge pour moins de 4 jours
    }
  };

  // Basculer l'état actif/inactif du chrono
  const toggleCountdown = async () => {
    return await saveCountdownSettings({
      is_active: !countdownSettings.is_active
    });
  };

  // Mettre à jour la date cible
  const updateTargetDate = async (newDate: string) => {
    return await saveCountdownSettings({
      target_date: newDate
    });
  };

  // Mettre à jour le titre
  const updateTitle = async (newTitle: string) => {
    return await saveCountdownSettings({
      title: newTitle
    });
  };

  // Mettre à jour la description
  const updateDescription = async (newDescription: string) => {
    return await saveCountdownSettings({
      description: newDescription
    });
  };

  // Charger les paramètres au montage du composant
  useEffect(() => {
    loadCountdownSettings();
  }, []);

  // Calculer le temps restant toutes les secondes
  useEffect(() => {
    const interval = setInterval(calculateTimeRemaining, 1000);
    calculateTimeRemaining(); // Calcul initial

    return () => clearInterval(interval);
  }, [countdownSettings]);

  // Écouter les changements en temps réel
  useEffect(() => {
    const subscription = supabase
      .channel('countdown_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'countdown_settings'
        },
        (payload) => {
          console.log('Changement détecté dans countdown_settings:', payload);
          loadCountdownSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    countdownSettings,
    timeRemaining,
    isCountdownFinished,
    loading,
    error,
    getCountdownTextColor,
    saveCountdownSettings,
    toggleCountdown,
    updateTargetDate,
    updateTitle,
    updateDescription,
    refreshSettings: loadCountdownSettings
  };
};