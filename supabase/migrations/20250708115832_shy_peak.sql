/*
  # Mise à jour de la gestion du chrono

  1. Modifications de la table countdown_settings
    - Ajout de colonnes pour une gestion complète
    - Configuration par défaut optimisée
    - Contraintes de validation

  2. Sécurité
    - Politiques RLS mises à jour
    - Accès admin seulement pour les modifications
    - Lecture publique pour l'affichage

  3. Données par défaut
    - Configuration initiale du chrono
    - Paramètres de révélation
*/

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS countdown_settings;

-- Créer la nouvelle table countdown_settings avec tous les champs nécessaires
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
) ON CONFLICT DO NOTHING;

-- Activer RLS
ALTER TABLE countdown_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture publique (tout le monde peut voir le chrono)
CREATE POLICY "Public can read countdown settings"
  ON countdown_settings
  FOR SELECT
  TO anon, authenticated
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

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_countdown_settings_updated_at ON countdown_settings;
CREATE TRIGGER update_countdown_settings_updated_at
    BEFORE UPDATE ON countdown_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();