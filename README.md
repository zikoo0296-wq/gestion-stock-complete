# 📦 Stock Pro - Gestion de Stock Professionnelle

Application web complète de gestion de stock avec authentification et base de données cloud.

## 🚀 Fonctionnalités

- ✅ Authentification sécurisée (Email/Password + Google)
- ✅ Base de données Firebase en temps réel
- ✅ Gestion complète des produits
- ✅ Points de vente multiples
- ✅ Mouvements de stock (Entrées/Sorties/Transferts)
- ✅ Historique détaillé
- ✅ Import/Export Excel
- ✅ Interface responsive et moderne

## 📋 Prérequis

1. Un compte Firebase (gratuit)
2. Un navigateur web moderne
3. Un hébergement web (GitHub Pages, Netlify, etc.)

## ⚙️ Installation

### Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com)
2. Cliquez sur "Ajouter un projet"
3. Nom du projet : `stock-management-pro`
4. Désactivez Google Analytics (optionnel)
5. Cliquez "Créer le projet"

### Étape 2 : Configurer Firebase Authentication

1. Dans Firebase Console, allez dans **Authentication**
2. Cliquez sur "Commencer"
3. Activez ces méthodes de connexion :
   - **Email/Password** : Activez
   - **Google** : Activez et configurez

### Étape 3 : Configurer Firestore Database

1. Dans Firebase Console, allez dans **Firestore Database**
2. Cliquez "Créer une base de données"
3. Mode : **Production** (ou Test pour développement)
4. Localisation : Choisissez la plus proche de vos utilisateurs
5. Cliquez "Activer"

### Étape 4 : Obtenir les identifiants Firebase

1. Dans Firebase Console, cliquez sur l'icône ⚙️ (Paramètres)
2. Allez dans **Paramètres du projet**
3. Descendez jusqu'à "Vos applications"
4. Cliquez sur l'icône Web `</>`
5. Nom de l'app : `Stock Pro`
6. Cochez "Configurer Firebase Hosting"
7. Cliquez "Enregistrer l'application"
8. **COPIEZ** les identifiants affichés

### Étape 5 : Configurer l'application

1. Ouvrez le fichier `js/firebase-config.js`
2. Remplacez les valeurs par vos propres identifiants :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### Étape 6 : Configurer les règles de sécurité Firestore

Dans Firebase Console > Firestore Database > Règles, collez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour les utilisateurs
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles pour les produits
    match /products/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Règles pour les mouvements
    match /movements/{movementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Règles pour les points de vente
    match /pointsVente/{pdvId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 🌐 Déploiement

### Option 1 : GitHub Pages (Recommandé)

1. Créez un repository GitHub
2. Uploadez tous les fichiers
3. Allez dans Settings > Pages
4. Source : "Deploy from branch"
5. Branch : "main" → folder : "/ (root)"
6. Votre site sera disponible à : `https://username.github.io/repository-name/`

### Option 2 : Firebase Hosting

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase
firebase init hosting

# Déployer
firebase deploy
```

### Option 3 : Netlify

1. Glissez-déposez le dossier complet sur [netlify.com](https://netlify.com)
2. Votre site est en ligne instantanément !

## 📁 Structure du projet

```
stock-management-pro/
├── index.html              # Page de connexion
├── register.html           # Page d'inscription
├── dashboard.html          # Application principale
├── css/
│   ├── login.css          # Styles authentification
│   └── dashboard.css      # Styles application
├── js/
│   ├── firebase-config.js # Configuration Firebase
│   ├── auth.js            # Authentification
│   ├── app.js             # Logique application
│   └── utils.js           # Fonctions utilitaires
├── images/
│   ├── logo.png
│   └── placeholder.png
└── README.md
```

## 🔒 Sécurité

- Les mots de passe sont cryptés par Firebase
- Les données sont protégées par des règles Firestore
- Authentification sécurisée avec tokens JWT
- Support HTTPS obligatoire

## 🆘 Résolution des problèmes

### Erreur "Firebase not initialized"
- Vérifiez que vous avez bien remplacé les identifiants dans `firebase-config.js`

### Erreur "Permission denied"
- Vérifiez les règles de sécurité Firestore
- Assurez-vous d'être connecté

### Page blanche après connexion
- Ouvrez la console développeur (F12)
- Vérifiez les erreurs JavaScript
- Assurez-vous que tous les fichiers sont bien uploadés

## 📞 Support

Pour toute question ou problème :
1. Vérifiez la console Firebase
2. Consultez la documentation Firebase
3. Ouvrez une issue sur GitHub

## 📄 Licence

MIT License - Libre d'utilisation

## 👨‍💻 Auteur

Créé avec ❤️ pour la gestion de stock professionnelle

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025