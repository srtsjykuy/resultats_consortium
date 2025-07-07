# 🌟 Consortium des Esprits Exceptionnels

Site officiel pour la présentation des résultats du Consortium des Esprits Exceptionnels.

## ✨ Fonctionnalités

- **Interface élégante** avec animations et effets visuels
- **Système de compte à rebours** configurable
- **Panneau d'administration sécurisé** avec authentification
- **Gestion des membres** (ajout, modification, suppression)
- **Import/Export Excel** pour la gestion des données
- **Recherche avancée** des membres
- **Design responsive** pour tous les appareils
- **Sécurité renforcée** avec protection contre les attaques

## 🚀 Installation

```bash
# Cloner le projet
git clone [url-du-repo]

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## 🔧 Configuration

1. Copier `.env.example` vers `.env`
2. Modifier les variables d'environnement selon vos besoins
3. Changer les identifiants administrateur par défaut

## 🛡️ Sécurité

- Authentification sécurisée avec limitation des tentatives
- Validation et sanitisation des données
- Protection contre XSS et injections
- Sessions avec timeout automatique
- Chiffrement des données stockées

## 📱 PWA

Le site est configuré comme une Progressive Web App :
- Installation possible sur mobile/desktop
- Fonctionnement hors ligne
- Notifications push (si configurées)

## 🎨 Personnalisation

- Couleurs et thèmes dans `tailwind.config.js`
- Animations dans `src/index.css`
- Composants modulaires dans `src/components/`

## 📊 Production

### Optimisations incluses :
- Minification du code
- Compression des assets
- Lazy loading des composants
- Service Worker pour le cache
- SEO optimisé

### Déploiement :
1. `npm run build`
2. Déployer le dossier `dist/`
3. Configurer HTTPS
4. Activer la compression gzip

## 🔒 Identifiants par défaut

**⚠️ À CHANGER EN PRODUCTION ⚠️**
- Username: `consortium2025`
- Password: `1Consortium$`

## 📝 License

Propriétaire - Consortium des Esprits Exceptionnels