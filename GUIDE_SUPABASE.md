# 🚀 GUIDE COMPLET - INTÉGRATION SUPABASE

## 📋 Table des matières
1. [Création du compte Supabase](#1-création-du-compte-supabase)
2. [Configuration de la base de données](#2-configuration-de-la-base-de-données)
3. [Configuration de l'authentification](#3-configuration-de-lauthentification)
4. [Installation de l'application](#4-installation-de-lapplication)
5. [Déploiement](#5-déploiement)
6. [Résolution des problèmes](#6-résolution-des-problèmes)

---

## 1. Création du compte Supabase

### Étape 1.1 : Créer un compte

1. Allez sur **https://supabase.com**
2. Cliquez sur **"Start your project"**
3. Connectez-vous avec **GitHub** (recommandé) ou **Email**

### Étape 1.2 : Créer un nouveau projet

1. Cliquez sur **"New Project"**
2. Remplissez les informations :
   - **Name** : `gestion-stock-pro`
   - **Database Password** : Générez un mot de passe FORT (gardez-le précieusement !)
   - **Region** : Choisissez le plus proche de vous (ex: Europe West pour le Maroc)
   - **Pricing Plan** : Free (gratuit - 500 MB suffit)

3. Cliquez sur **"Create new project"**
4. ⏳ Attendez 2-3 minutes que le projet soit créé

---

## 2. Configuration de la base de données

### Étape 2.1 : Copier vos identifiants

1. Dans votre projet Supabase, allez dans **Settings** (⚙️ en bas à gauche)
2. Cliquez sur **API** dans le menu
3. Vous verrez deux informations importantes :

```
Project URL: https://xyzcompany.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **COPIEZ** ces deux valeurs quelque part (vous en aurez besoin)

### Étape 2.2 : Exécuter le script SQL

1. Allez dans **SQL Editor** (dans le menu de gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `supabase-schema.sql` que je vous ai donné
4. **Copiez TOUT le contenu** du fichier
5. **Collez** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** en bas à droite
7. ✅ Vous devriez voir "Success" avec le message "Base de données créée avec succès! 🎉"

### Étape 2.3 : Vérifier les tables

1. Allez dans **Table Editor** (dans le menu de gauche)
2. Vous devriez voir ces tables :
   - ✅ user_profiles
   - ✅ products
   - ✅ points_vente
   - ✅ movements
   - ✅ sales
   - ✅ returns

---

## 3. Configuration de l'authentification

### Étape 3.1 : Activer Email/Password

1. Allez dans **Authentication** > **Providers**
2. **Email** est déjà activé par défaut ✅

### Étape 3.2 : Configurer Google OAuth (OPTIONNEL)

1. Dans **Authentication** > **Providers**
2. Cliquez sur **Google**
3. Activez **"Enable Sign in with Google"**
4. Suivez les instructions pour obtenir :
   - Client ID
   - Client Secret
5. Sauvegardez

### Étape 3.3 : Configurer l'URL du site

1. Dans **Authentication** > **URL Configuration**
2. **Site URL** : `https://votre-domaine.com` (ou `http://localhost:8080` pour test local)
3. **Redirect URLs** : Ajoutez ces URLs :
   ```
   http://localhost:8080/dashboard.html
   https://votre-domaine.com/dashboard.html
   https://votre-domaine.vercel.app/dashboard.html
   ```

---

## 4. Installation de l'application

### Étape 4.1 : Configurer supabase-config.js

1. Ouvrez le fichier `supabase-config.js`
2. Remplacez les valeurs :

```javascript
const SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Votre URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Votre clé
```

### Étape 4.2 : Structure des fichiers

Organisez vos fichiers comme ceci :

```
gestion-stock-pro/
├── index.html              (Page d'accueil/connexion)
├── dashboard.html          (Application principale)
├── supabase-config.js      (Configuration Supabase) ⭐ NOUVEAU
├── supabase-auth.js        (Authentification) ⭐ NOUVEAU
├── supabase-app.js         (Logique application) ⭐ NOUVEAU
├── dashboard.css           (Styles)
└── README.md
```

### Étape 4.3 : Tester en local

**Option 1 : Serveur Python (Recommandé)**
```bash
# Ouvrez un terminal dans le dossier du projet
python -m http.server 8080

# Ouvrez votre navigateur :
# http://localhost:8080
```

**Option 2 : Live Server (VS Code)**
1. Installez l'extension "Live Server"
2. Clic droit sur `index.html` > "Open with Live Server"

**Option 3 : Double-clic**
- Ouvrez directement `index.html` dans votre navigateur
- ⚠️ Certaines fonctionnalités peuvent ne pas marcher

---

## 5. Déploiement

### Option A : Vercel (RECOMMANDÉ - Gratuit)

1. Allez sur **https://vercel.com**
2. Connectez-vous avec GitHub
3. Cliquez sur **"New Project"**
4. Importez votre repository GitHub (ou uploadez les fichiers)
5. Cliquez sur **"Deploy"**
6. ✅ Votre app est en ligne en 2 minutes !

**URL finale** : `https://votre-app.vercel.app`

### Option B : Netlify (Gratuit)

1. Allez sur **https://netlify.com**
2. Glissez-déposez votre dossier complet
3. ✅ En ligne instantanément !

### Option C : GitHub Pages (Gratuit)

1. Créez un repository GitHub
2. Uploadez tous les fichiers
3. Allez dans **Settings** > **Pages**
4. Source : "Deploy from branch" > "main" > "/ (root)"
5. ✅ Votre site sera à : `https://username.github.io/repository-name/`

---

## 6. Résolution des problèmes

### ❌ Problème : "Invalid API key"

**Solution :**
1. Vérifiez que vous avez copié la bonne clé (anon public)
2. Vérifiez qu'il n'y a pas d'espace au début ou à la fin
3. La clé doit commencer par `eyJ`

### ❌ Problème : "Failed to fetch"

**Causes possibles :**
1. L'URL Supabase est incorrecte
2. Vous n'avez pas internet
3. Le projet Supabase est en pause (plan gratuit après 7 jours d'inactivité)

**Solution :**
- Vérifiez votre connexion internet
- Allez sur Supabase Dashboard et "Resume" le projet si nécessaire

### ❌ Problème : "new row violates row-level security policy"

**Solution :**
1. Allez dans **SQL Editor**
2. Exécutez cette requête :
```sql
SELECT * FROM user_profiles WHERE id = auth.uid();
```
3. Si vide, créez votre profil manuellement :
```sql
INSERT INTO user_profiles (id, email, full_name)
VALUES (auth.uid(), 'votre-email@example.com', 'Votre Nom');
```

### ❌ Problème : Les données ne s'affichent pas

**Vérifications :**
1. Ouvrez la console (F12) et regardez les erreurs
2. Vérifiez que vous êtes bien connecté
3. Allez dans Supabase > **Table Editor** et vérifiez que les données existent
4. Vérifiez les **RLS Policies** dans **Authentication** > **Policies**

### ❌ Problème : "Cannot read properties of null"

**Solution :**
- Vous n'êtes pas connecté
- Allez sur la page de connexion et connectez-vous

### ❌ Problème : Import Excel échoue

**Causes possibles :**
1. Le fichier Excel n'est pas au bon format
2. Les colonnes ne correspondent pas
3. Une référence existe déjà

**Solution :**
- Utilisez le template Excel fourni
- Vérifiez que les colonnes sont dans l'ordre : IMAGE, Real Name, Conventional Name, etc.
- Vérifiez qu'il n'y a pas de références en double

---

## 📊 Limites du plan gratuit Supabase

- ✅ 500 MB de stockage database
- ✅ 1 GB de stockage fichiers
- ✅ 2 GB de bande passante/mois
- ✅ 50,000 utilisateurs actifs mensuels
- ✅ Authentification illimitée
- ⚠️ Le projet se met en pause après 7 jours d'inactivité (il suffit de le "Resume")

**C'est largement suffisant pour une application de gestion de stock !** 🎉

---

## 🔒 Sécurité

### Bonnes pratiques :

1. **NE JAMAIS** partager votre `service_role` key (la clé secrète)
2. **TOUJOURS** utiliser la `anon` key dans le code frontend
3. Les RLS Policies protègent vos données automatiquement
4. Chaque utilisateur ne voit QUE ses propres données
5. Changez votre mot de passe de base de données régulièrement

---

## 📞 Support

### Ressources :

- **Documentation Supabase** : https://supabase.com/docs
- **Discord Supabase** : https://discord.supabase.com
- **GitHub Issues** : Créez une issue si problème

### Commandes SQL utiles :

```sql
-- Voir tous vos produits
SELECT * FROM products WHERE user_id = auth.uid();

-- Compter vos produits
SELECT COUNT(*) FROM products WHERE user_id = auth.uid();

-- Voir votre profil
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Supprimer TOUTES vos données (⚠️ ATTENTION)
DELETE FROM products WHERE user_id = auth.uid();
DELETE FROM movements WHERE user_id = auth.uid();
DELETE FROM sales WHERE user_id = auth.uid();
```

---

## ✅ Checklist finale

Avant de déployer en production :

- [ ] Compte Supabase créé
- [ ] Base de données initialisée (script SQL exécuté)
- [ ] Identifiants copiés dans `supabase-config.js`
- [ ] Authentification configurée (Email + Google optionnel)
- [ ] Application testée en local
- [ ] Inscription d'un compte test réussie
- [ ] Ajout d'un produit test réussi
- [ ] Import Excel test réussi
- [ ] Application déployée (Vercel/Netlify/GitHub Pages)
- [ ] URL de déploiement ajoutée dans Auth > URL Configuration

---

## 🎉 Félicitations !

Votre application de gestion de stock est maintenant fonctionnelle avec une **vraie base de données cloud** ! 🚀

**Avantages de Supabase :**
- ✅ Base de données PostgreSQL (très puissante)
- ✅ Authentification intégrée
- ✅ Données synchronisées en temps réel
- ✅ Accessible depuis n'importe quel appareil
- ✅ Sécurisé avec RLS
- ✅ Gratuit pour toujours (plan gratuit)
- ✅ Sauvegardes automatiques

**Profitez de votre nouvelle application !** 💪📊
