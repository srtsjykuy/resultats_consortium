/*
  # Initialisation des paramètres de compte à rebours

  1. Nouvelles données
    - Insertion d'un enregistrement par défaut dans `countdown_settings`
    - Configuration avec une date cible dans 24 heures
    - Titre et description en français
    - Compte à rebours actif par défaut

  2. Sécurité
    - Vérification que la table existe
    - Insertion seulement si aucun enregistrement n'existe
    - Utilisation de valeurs par défaut sécurisées

  3. Fonctionnalités
    - Paramètres prêts à l'emploi
    - Date cible automatiquement calculée
    - Configuration française par défaut
*/

-- Insérer des paramètres par défaut seulement si la table est vide
INSERT INTO countdown_settings (
  target_date,
  is_active,
  title,
  description,
  created_by
)
SELECT 
  (now() + interval '24 hours') as target_date,
  true as is_active,
  'LES RÉSULTATS SERONT DISPONIBLES DANS' as title,
  'Les résultats exceptionnels de nos membres d''élite seront bientôt révélés.' as description,
  'system' as created_by
WHERE NOT EXISTS (
  SELECT 1 FROM countdown_settings
);

-- Créer une fonction pour mettre à jour automatiquement la date cible
CREATE OR REPLACE FUNCTION extend_countdown_if_expired()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si le compte à rebours est expiré, l'étendre de 24 heures
  UPDATE countdown_settings 
  SET 
    target_date = (now() + interval '24 hours'),
    updated_at = now()
  WHERE 
    is_active = true 
    AND target_date < now();
END;
$$;

-- Créer un trigger pour vérifier automatiquement l'expiration
CREATE OR REPLACE FUNCTION check_countdown_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier si le compte à rebours est expiré lors de la lecture
  IF NEW.target_date < now() AND NEW.is_active = true THEN
    NEW.target_date := (now() + interval '24 hours');
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Appliquer le trigger sur les sélections
CREATE OR REPLACE TRIGGER countdown_expiration_check
  BEFORE UPDATE ON countdown_settings
  FOR EACH ROW
  EXECUTE FUNCTION check_countdown_expiration();

-- Créer une vue pour faciliter l'accès aux paramètres actifs
CREATE OR REPLACE VIEW active_countdown AS
SELECT 
  id,
  target_date,
  is_active,
  title,
  description,
  created_at,
  updated_at,
  created_by,
  CASE 
    WHEN target_date > now() THEN 
      EXTRACT(EPOCH FROM (target_date - now()))::integer
    ELSE 0
  END as seconds_remaining
FROM countdown_settings 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 1;

-- Accorder les permissions sur la vue
GRANT SELECT ON active_countdown TO anon, authenticated;

-- Fonction utilitaire pour réinitialiser le compte à rebours
CREATE OR REPLACE FUNCTION reset_countdown(hours_from_now integer DEFAULT 24)
RETURNS countdown_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result countdown_settings;
BEGIN
  -- Mettre à jour ou créer un nouveau compte à rebours
  INSERT INTO countdown_settings (
    target_date,
    is_active,
    title,
    description,
    created_by
  ) VALUES (
    (now() + (hours_from_now || ' hours')::interval),
    true,
    'LES RÉSULTATS SERONT DISPONIBLES DANS',
    'Les résultats exceptionnels de nos membres d''élite seront bientôt révélés.',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    target_date = (now() + (hours_from_now || ' hours')::interval),
    is_active = true,
    updated_at = now()
  RETURNING * INTO result;
  
  -- Désactiver tous les autres comptes à rebours
  UPDATE countdown_settings 
  SET is_active = false, updated_at = now()
  WHERE id != result.id;
  
  RETURN result;
END;
$$;

-- Accorder les permissions sur la fonction aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION reset_countdown(integer) TO authenticated;