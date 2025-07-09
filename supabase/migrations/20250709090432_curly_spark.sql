/*
  # Création de la table countdown_settings

  1. Nouvelles Tables
    - `countdown_settings`
      - `id` (uuid, clé primaire)
      - `target_date` (timestamptz, date cible du compte à rebours)
      - `is_active` (boolean, statut actif/inactif)
      - `title` (text, titre affiché)
      - `description` (text, description optionnelle)
      - `created_at` (timestamptz, date de création)
      - `updated_at` (timestamptz, date de mise à jour)
      - `created_by` (text, créateur)

  2. Sécurité
    - Activer RLS sur la table `countdown_settings`
    - Politique de lecture pour tous les utilisateurs
    - Politique d'écriture pour les utilisateurs authentifiés

  3. Fonctionnalités
    - Trigger de mise à jour automatique
    - Vue pour les paramètres actifs
    - Fonction de réinitialisation du compte à rebours
*/

-- Créer la table countdown_settings
CREATE TABLE IF NOT EXISTS countdown_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_date timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT 'LES RÉSULTATS SERONT DISPONIBLES DANS',
  description text DEFAULT 'Les résultats exceptionnels de nos membres d''élite seront bientôt révélés.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'system'
);

-- Activer RLS
ALTER TABLE countdown_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour tous (anonyme et authentifié)
CREATE POLICY "Lecture publique des paramètres de compte à rebours"
  ON countdown_settings
  FOR SELECT
  TO public
  USING (true);

-- Politique d'écriture pour les utilisateurs authentifiés
CREATE POLICY "Écriture pour utilisateurs authentifiés"
  ON countdown_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_countdown_settings_updated_at
  BEFORE UPDATE ON countdown_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer des paramètres par défaut
INSERT INTO countdown_settings (
  target_date,
  is_active,
  title,
  description,
  created_by
) VALUES (
  (now() + interval '24 hours'),
  true,
  'LES RÉSULTATS SERONT DISPONIBLES DANS',
  'Les résultats exceptionnels de nos membres d''élite seront bientôt révélés.',
  'system'
) ON CONFLICT DO NOTHING;

-- Créer une vue pour les paramètres actifs
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

-- Fonction pour réinitialiser le compte à rebours
CREATE OR REPLACE FUNCTION reset_countdown(hours_from_now integer DEFAULT 24)
RETURNS countdown_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result countdown_settings;
BEGIN
  -- Désactiver tous les comptes à rebours existants
  UPDATE countdown_settings SET is_active = false, updated_at = now();
  
  -- Créer un nouveau compte à rebours
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
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION reset_countdown(integer) TO authenticated;