/*
  # Gestion du chrono depuis la base de données

  1. Nouvelle table
    - `countdown_settings` pour stocker les paramètres du chrono
    - Champs: target_date, is_active, title, description
    - Timestamps automatiques et gestion des utilisateurs

  2. Sécurité
    - Enable RLS sur la table countdown_settings
    - Politique de lecture publique pour l'affichage
    - Politique de modification pour les admins authentifiés

  3. Fonctions
    - Trigger automatique pour updated_at
    - Configuration par défaut
*/

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS countdown_settings CASCADE;

-- Créer la nouvelle table countdown_settings
CREATE TABLE countdown_settings (
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

-- Politique pour la lecture publique (tout le monde peut voir le chrono)
CREATE POLICY "Public can read countdown settings"
  ON countdown_settings
  FOR SELECT
  USING (true);

-- Politique pour la modification (admin seulement)
CREATE POLICY "Admin can update countdown settings"
  ON countdown_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- Politique pour l'insertion (admin seulement)
CREATE POLICY "Admin can insert countdown settings"
  ON countdown_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique pour la suppression (admin seulement)
CREATE POLICY "Admin can delete countdown settings"
  ON countdown_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_countdown_settings_updated_at
    BEFORE UPDATE ON countdown_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer la configuration par défaut
INSERT INTO countdown_settings (
  target_date,
  is_active,
  title,
  description
) VALUES (
  now() + interval '24 hours',
  true,
  'LES RÉSULTATS SERONT DISPONIBLES DANS',
  'Les résultats exceptionnels de nos membres d''élite seront bientôt révélés. Préparez-vous à découvrir l''excellence !'
);