# 🚀 Gestion de Stock Pro - Guide d'Installation Complet

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation PostgreSQL](#installation-postgresql)
3. [Installation du Backend](#installation-du-backend)
4. [Configuration Frontend](#configuration-frontend)
5. [Démarrage de l'application](#démarrage)
6. [Format Excel](#format-excel)
7. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### Logiciels nécessaires :
- **Node.js** (version 16 ou supérieure) - [Télécharger](https://nodejs.org/)
- **PostgreSQL** (version 12 ou supérieure) - [Télécharger](https://www.postgresql.org/download/)
- **Git** (optionnel) - [Télécharger](https://git-scm.com/)

### Vérifier les installations :
```bash
node --version    # Doit afficher v16.x.x ou supérieur
npm --version     # Doit afficher 8.x.x ou supérieur
psql --version    # Doit afficher PostgreSQL 12.x ou supérieur
```

---

## 💾 Installation PostgreSQL

### **Windows :**
1. Télécharger l'installateur depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Lancer l'installateur et suivre les étapes
3. **IMPORTANT** : Noter le mot de passe choisi pour l'utilisateur `postgres`
4. Port par défaut : `5432` (ne pas modifier)
5. Installer Stack Builder (optionnel)

### **Mac :**
```bash
# Avec Homebrew
brew install postgresql@14
brew services start postgresql@14

# Créer un utilisateur
createuser -s postgres
```

### **Linux (Ubuntu/Debian) :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Définir un mot de passe
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password';
\q
```

### **Créer la base de données :**
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE gestion_stock;

# Vérifier
\l

# Quitter
\q
```

---

## 🔙 Installation du Backend

### 1. **Créer le dossier du projet**
```bash
mkdir gestion-stock-backend
cd gestion-stock-backend
```

### 2. **Créer les fichiers**

Créez ces fichiers avec leur contenu :

**package.json**
```json
{
  "name": "gestion-stock-backend",
  "version": "1.0.0",
  "description": "Backend API pour Gestion de Stock Pro",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node init-database.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**. env** (copiez depuis .env.example et modifiez)
```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gestion_stock
DB_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
DB_PORT=5432
PORT=3000
NODE_ENV=development
```

⚠️ **IMPORTANT** : Remplacez `VOTRE_MOT_DE_PASSE_ICI` par votre vrai mot de passe PostgreSQL !

**server.js** - Copiez le contenu de l'artifact "Backend - server.js"

**init-database.js** - Copiez le contenu de l'artifact "Backend - init-database.js"

### 3. **Installer les dépendances**
```bash
npm install
```

### 4. **Initialiser la base de données**
```bash
npm run init-db
```

Vous devriez voir :
```
🔄 Initialisation de la base de données...
✅ Tables existantes supprimées
✅ Table "products" créée
✅ Table "movements" créée
✅ Table "sales" créée
✅ Table "returns" créée
✅ Index créés pour les performances
✅ Données de démonstration insérées
✨ Base de données initialisée avec succès !
```

### 5. **Démarrer le serveur**
```bash
npm start
```

Vous devriez voir :
```
✅ Connecté à PostgreSQL: 2025-10-09...
🚀 Serveur démarré sur http://localhost:3000
📊 API disponible sur http://localhost:3000/api
```

---

## 🎨 Configuration Frontend

### 1. **Créer le fichier HTML**
```bash
# Dans un dossier séparé
mkdir gestion-stock-frontend
cd gestion-stock-frontend
```

Créez le fichier `index.html` avec le contenu de l'artifact "Frontend HTML/CSS/JS"

### 2. **Vérifier la configuration API**

Dans le fichier `index.html`, vérifiez que cette ligne est présente :
```javascript
const API_URL = 'http://localhost:3000/api';
```

### 3. **Ouvrir l'application**
Double-cliquez sur `index.html` ou ouvrez-le dans votre navigateur.

---

## 📊 Format Excel pour l'Import

### Colonnes requises (dans cet ordre) :

| IMAGE | Real Name | Conventional Name | Selling Price | Barcode | Repetition | Barcode Category | Category | Brand | Référence |
|-------|-----------|-------------------|---------------|---------|-----------|------------------|----------|-------|-----------|

### Exemple de fichier Excel :

| IMAGE | Real Name | Conventional Name | Selling Price | Barcode | Repetition | Barcode Category | Category | Brand | Référence |
|-------|-----------|-------------------|---------------|---------|-----------|------------------|----------|-------|-----------|
| https://drive.google.com/uc?export=view&id=1Mou... | Ordinateur Dell XPS | Dell XPS | 1299.99 | 123456 | 25 | EAN-13 | Informatique | Dell | DELL-001 |
| https://drive.google.com/uc?export=view&id=1Abc... | iPhone 15 Pro | iPhone 15 | 1449.99 | 654321 | 10 | EAN-13 | Téléphones | Apple | APPLE-001 |

### Notes importantes :
- **IMAGE** : URL Google Drive au format `https://drive.google.com/uc?export=view&id=VOTRE_ID`
- **Real Name** : Nom réel du produit (obligatoire)
- **Conventional Name** : Nom commercial (optionnel)
- **Repetition** : C'est la quantité en stock
- **Référence** : Identifiant unique (obligatoire)

---

## 🚀 Démarrage de l'application

### **1. Démarrer PostgreSQL** (si pas déjà démarré)
```bash
# Windows : Déjà démarré automatiquement

# Mac :
brew services start postgresql@14

# Linux :
sudo systemctl start postgresql
```

### **2. Démarrer le Backend**
```bash
cd gestion-stock-backend
npm start
```

### **3. Ouvrir le Frontend**
Double-cliquez sur `index.html` dans votre navigateur

---

## ⚡ Import de 2000+ Produits sans Freeze

L'application utilise plusieurs optimisations :

### **1. Traitement par batch**
Les produits sont traités par lots de 50, ce qui évite de bloquer le navigateur.

### **2. Barre de progression**
Une barre de progression indique l'avancement en temps réel.

### **3. Traitement asynchrone**
Le code utilise `async/await` et `setTimeout` pour ne pas bloquer l'interface.

### **4. Transactions PostgreSQL**
Le backend utilise des transactions pour assurer l'intégrité des données.

### **Temps estimés d'import :**
- 100 produits : ~2-3 secondes
- 500 produits : ~8-10 secondes
- 2000 produits : ~30-40 secondes
- 5000 produits : ~1-2 minutes

---

## 🔧 Dépannage

### **Problème 1 : Erreur de connexion à PostgreSQL**
```
❌ Erreur de connexion à la base de données
```

**Solution :**
```bash
# Vérifier que PostgreSQL est démarré
# Windows : Ouvrir "Services" et vérifier "postgresql"
# Mac :
brew services list

# Linux :
sudo systemctl status postgresql

# Vérifier le mot de passe dans .env
cat .env
```

### **Problème 2 : Port 3000 déjà utilisé**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution :**
```bash
# Windows :
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux :
lsof -ti:3000 | xargs kill -9

# Ou changer le port dans .env :
PORT=3001
```

### **Problème 3 : CORS Error**
```
Access to fetch at 'http://localhost:3000/api' has been blocked by CORS
```

**Solution :**
- Vérifier que le backend est démarré
- Vérifier que l'URL dans le frontend est correcte (`http://localhost:3000/api`)

### **Problème 4 : Import Excel échoue**
```
❌ Erreur d'importation
```

**Solutions :**
1. Vérifier que les colonnes sont dans le bon ordre
2. Vérifier que "Real Name" et "Référence" sont renseignés
3. Vérifier que "Repetition" contient des nombres
4. Essayer avec un fichier plus petit d'abord (10-20 lignes)

### **Problème 5 : Images Google Drive ne s'affichent pas**
```
Image non chargée
```

**Solution :**
Le format d'URL doit être :
```
https://drive.google.com/uc?export=view&id=VOTRE_ID
```

Pour obtenir l'ID depuis un lien Google Drive :
```
Lien original: https://drive.google.com/file/d/1Mou-TxW2JGz8hOjd2rJoL5NhxEpOT_dx/view
ID à extraire: 1Mou-TxW2JGz8hOjd2rJoL5NhxEpOT_dx
Lien à utiliser: https://drive.google.com/uc?export=view&id=1Mou-TxW2JGz8hOjd2rJoL5NhxEpOT_dx
```

---

## 📱 API Endpoints

### **Products**
- `GET /api/products` - Liste tous les produits
- `GET /api/products/:id` - Récupère un produit
- `POST /api/products` - Crée un produit
- `POST /api/products/batch` - Import en masse
- `PUT /api/products/:id` - Modifie un produit
- `DELETE /api/products/:id` - Supprime un produit

### **Movements**
- `GET /api/movements` - Liste tous les mouvements
- `POST /api/movements` - Crée un mouvement

### **Sales**
- `GET /api/sales` - Liste toutes les ventes

### **Returns**
- `GET /api/returns` - Liste tous les retours
- `POST /api/returns` - Crée un retour

### **Statistics**
- `GET /api/stats` - Statistiques du dashboard

---

## 🔐 Sécurité (Pour la production)

Pour un déploiement en production, ajoutez :

1. **Authentification JWT**
2. **Validation des données** (express-validator)
3. **Rate limiting** (express-rate-limit)
4. **HTTPS** (certificat SSL)
5. **Sauvegarde automatique** de la base de données
6. **Variables d'environnement sécurisées**

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du backend dans le terminal
2. Vérifiez la console du navigateur (F12)
3. Vérifiez que PostgreSQL est bien démarré
4. Vérifiez les mots de passe dans `.env`

---

## ✅ Checklist de démarrage rapide

- [ ] PostgreSQL installé et démarré
- [ ] Base de données `gestion_stock` créée
- [ ] Node.js installé (v16+)
- [ ] Dossier backend créé avec tous les fichiers
- [ ] `.env` configuré avec le bon mot de passe
- [ ] `npm install` exécuté
- [ ] `npm run init-db` exécuté avec succès
- [ ] Backend démarré (`npm start`)
- [ ] Frontend (`index.html`) ouvert dans le navigateur
- [ ] Test d'ajout de produit réussi
- [ ] Test d'import Excel réussi

---

## 🎉 Félicitations !

Votre application de gestion de stock est maintenant opérationnelle !

**Fonctionnalités disponibles :**
✅ Gestion complète des produits
✅ Import Excel massif (2000+ produits)
✅ Entrées/Sorties avec traçabilité
✅ Gestion des retours clients
✅ Statistiques et graphiques
✅ Export Excel
✅ Base de données persistante PostgreSQL
✅ API REST complète