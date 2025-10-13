# 🏪 Gestion de Stock Pro

Application web professionnelle de gestion de stock avec backend Node.js + PostgreSQL et frontend HTML/CSS/JavaScript.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D12.0-blue)

## 📸 Aperçu

Une application complète pour gérer votre inventaire avec :
- ✅ Gestion des produits (CRUD complet)
- ✅ Import/Export Excel massif (2000+ produits)
- ✅ Entrées et sorties de stock avec traçabilité
- ✅ Gestion des retours clients
- ✅ Dashboard avec statistiques et graphiques
- ✅ Alertes de stock faible
- ✅ Multi-utilisateurs (fonctionnalité à venir)
- ✅ API REST complète
- ✅ Base de données persistante PostgreSQL

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** v16+ ([Télécharger](https://nodejs.org/))
- **PostgreSQL** v12+ ([Télécharger](https://www.postgresql.org/))
- **npm** ou **yarn**

### Installation Rapide (5 minutes)

```bash
# 1. Cloner le projet
git clone https://github.com/votre-repo/gestion-stock.git
cd gestion-stock

# 2. Installer PostgreSQL et créer la base de données
psql -U postgres
CREATE DATABASE gestion_stock;
\q

# 3. Configurer le backend
cd backend
npm install
cp .env.example .env
nano .env  # Modifier le mot de passe PostgreSQL

# 4. Initialiser la base de données
npm run init-db

# 5. Démarrer le backend
npm start

# 6. Ouvrir le frontend (nouvel onglet terminal)
cd ../frontend
# Ouvrir index.html dans votre navigateur
# Ou avec un serveur HTTP simple :
npx serve .
```

🎉 **C'est prêt !** Accédez à http://localhost:3000 (backend) et ouvrez `index.html` (frontend)

## 📁 Structure du Projet

```
gestion-stock/
├── backend/                    # API Node.js + Express
│   ├── server.js              # Serveur principal
│   ├── init-database.js       # Script d'initialisation BDD
│   ├── backup-database.js     # Script de sauvegarde
│   ├── test-api.js            # Tests automatiques
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
├── frontend/                   # Application web
│   └── index.html             # Application single-page
├── docs/                       # Documentation
│   ├── GUIDE_INSTALLATION.md
│   ├── GUIDE_DEPLOIEMENT.md
│   └── API.md
├── docker-compose.yml          # Configuration Docker
├── nginx.conf                  # Configuration Nginx
├── .gitignore
└── README.md
```

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **node-pg** - Client PostgreSQL pour Node.js
- **dotenv** - Gestion des variables d'environnement
- **cors** - Gestion des requêtes cross-origin

### Frontend
- **HTML5/CSS3** - Structure et style
- **Vanilla JavaScript** - Logique applicative
- **Chart.js** - Graphiques et statistiques
- **SheetJS (xlsx)** - Import/Export Excel

### DevOps
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration multi-conteneurs
- **Nginx** - Serveur web et reverse proxy
- **PM2** - Gestionnaire de processus Node.js

## 📊 Fonctionnalités Détaillées

### 1. Gestion des Produits
- Ajout, modification, suppression de produits
- Champs: Nom réel, nom conventionnel, référence, barcode, catégorie, marque
- Support des images (Google Drive URLs)
- Recherche avancée et filtres
- Import massif via Excel (2000+ produits sans freeze)
- Export Excel avec tous les champs

### 2. Mouvements de Stock
- Entrées: Réapprovisionnement, Retour client, Ajustement
- Sorties: Vente, Transfert, Perte/Casse
- Sélection multiple de produits par checkbox
- Validation anti-dépassement de stock
- Traçabilité complète (date, utilisateur, raison)

### 3. Gestion des Ventes et Retours
- Enregistrement automatique des ventes
- Création de retours avec raison
- Ajout automatique au stock lors d'un retour
- Historique complet par client

### 4. Dashboard et Statistiques
- Statistiques en temps réel
- Graphiques: Top produits vendus, répartition par catégorie
- Alertes de stock faible
- Évolution du stock sur 7 jours

### 5. Rapports et Exports
- Export Excel: produits, ventes, retours, alertes
- Format personnalisable
- Génération instantanée

## 🔧 Configuration

### Variables d'Environnement (.env)

```bash
# Base de données
DB_USER=postgres
DB_HOST=localhost
DB_NAME=gestion_stock
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432

# Serveur
PORT=3000
NODE_ENV=development

# Sauvegardes
BACKUP_DIR=./backups
KEEP_BACKUPS=7
```

### Format Excel pour Import

Les colonnes requises (ordre important) :

| IMAGE | Real Name | Conventional Name | Selling Price | Barcode | Repetition | Barcode Category | Category | Brand | Référence |
|-------|-----------|-------------------|---------------|---------|-----------|------------------|----------|-------|-----------|

**Exemple :**
```
IMAGE: https://drive.google.com/uc?export=view&id=1Mou...
Real Name: Ordinateur Portable Dell XPS 13
Conventional Name: Dell XPS
Barcode: 1234567890123
Repetition: 25
Category: Informatique
Brand: Dell
Référence: DELL-XPS-001
```

## 🔌 API Endpoints

### Products
```
GET    /api/products           - Liste tous les produits
GET    /api/products/:id       - Récupère un produit
POST   /api/products           - Crée un produit
POST   /api/products/batch     - Import en masse
PUT    /api/products/:id       - Modifie un produit
DELETE /api/products/:id       - Supprime un produit
```

### Movements
```
GET    /api/movements          - Liste tous les mouvements
POST   /api/movements          - Crée un/des mouvement(s)
```

### Sales & Returns
```
GET    /api/sales              - Liste toutes les ventes
GET    /api/returns            - Liste tous les retours
POST   /api/returns            - Crée un retour
```

### Statistics
```
GET    /api/stats              - Statistiques du dashboard
```

📖 **Documentation complète de l'API :** [API.md](docs/API.md)

## 🐳 Déploiement avec Docker

```bash
# Lancer avec Docker Compose
docker-compose up -d

# Initialiser la base de données
docker-compose exec backend node init-database.js

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

## 🧪 Tests

```bash
# Tester l'API
cd backend
node test-api.js

# Tous les tests doivent passer (✅ PASS)
```

## 💾 Sauvegardes

```bash
# Créer une sauvegarde manuelle
cd backend
node backup-database.js backup

# Lister les sauvegardes
node backup-database.js list

# Restaurer une sauvegarde
node backup-database.js restore ./backups/backup_YYYYMMDD_HHMMSS.sql

# Nettoyer les anciennes sauvegardes
node backup-database.js clean
```

### Sauvegardes Automatiques

Ajouter au crontab :
```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * cd /chemin/vers/backend && node backup-database.js auto
```

## 📚 Documentation Complète

- [📘 Guide d'Installation](docs/GUIDE_INSTALLATION.md)
- [🚀 Guide de Déploiement en Production](docs/GUIDE_DEPLOIEMENT.md)
- [🔌 Documentation API](docs/API.md)
- [🔧 Dépannage](docs/TROUBLESHOOTING.md)

## 🛣️ Roadmap

### Version 1.0 ✅
- [x] CRUD Produits
- [x] Import/Export Excel
- [x] Entrées/Sorties
- [x] Retours clients
- [x] Dashboard
- [x] API REST
- [x] Base de données PostgreSQL

### Version 1.1 (En cours)
- [ ] Authentification JWT
- [ ] Multi-utilisateurs avec rôles
- [ ] Historique par utilisateur
- [ ] Notifications en temps réel
- [ ] Scanner de codes-barres
- [ ] Application mobile (PWA)

### Version 2.0 (Futur)
- [ ] Gestion des fournisseurs
- [ ] Bons de commande
- [ ] Factures
- [ ] Rapports avancés
- [ ] API GraphQL
- [ ] Machine Learning pour prédictions de stock

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

Développé avec ❤️ pour simplifier la gestion de stock

## 🆘 Support

- 📧 Email: support@votre-domaine.com
- 💬 Discord: [Rejoindre](https://discord.gg/votre-serveur)
- 🐛 Issues: [GitHub Issues](https://github.com/votre-repo/gestion-stock/issues)

## ⭐ Remerciements

Merci à tous les contributeurs et utilisateurs de cette application !

---

**Si vous trouvez ce projet utile, n'hésitez pas à mettre une ⭐ sur GitHub !**