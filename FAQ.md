# ❓ FAQ - Questions Fréquentes

## 🚀 Installation et Configuration

### Q: L'installation échoue avec "EADDRINUSE: address already in use"
**R:** Le port 3000 est déjà utilisé par une autre application.

**Solutions:**
```bash
# Option 1: Trouver et arrêter le processus
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9

# Option 2: Changer le port dans .env
PORT=3001
```

### Q: "Connection refused" lors de la connexion à PostgreSQL
**R:** PostgreSQL n'est pas démarré ou mal configuré.

**Solutions:**
```bash
# Vérifier le statut
# Linux:
sudo systemctl status postgresql

# Mac:
brew services list

# Démarrer PostgreSQL
# Linux:
sudo systemctl start postgresql

# Mac:
brew services start postgresql@14
```

### Q: "password authentication failed for user postgres"
**R:** Le mot de passe dans `.env` ne correspond pas au mot de passe PostgreSQL.

**Solution:**
```bash
# Réinitialiser le mot de passe PostgreSQL
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nouveau_mot_de_passe';
\q

# Puis mettre à jour .env
nano backend/.env
# Modifier: DB_PASSWORD=nouveau_mot_de_passe
```

---

## 📊 Import/Export Excel

### Q: L'import Excel échoue ou les données sont incorrectes
**R:** Le format du fichier Excel ne correspond pas au format attendu.

**Solution:**
Assurez-vous que votre fichier Excel contient ces colonnes **dans cet ordre exact:**

| IMAGE | Real Name | Conventional Name | Selling Price | Barcode | Repetition | Barcode Category | Category | Brand | Référence |
|-------|-----------|-------------------|---------------|---------|-----------|------------------|----------|-------|-----------|

**Colonnes obligatoires:**
- Real Name (Nom du produit)
- Référence (Identifiant unique)
- Repetition (Quantité en stock)

### Q: L'import de 2000+ produits freeze le navigateur
**R:** C'est normal pendant l'import, mais il ne devrait pas vraiment freeze.

**Vérifications:**
1. Assurez-vous que le backend est démarré
2. Vérifiez la console du navigateur (F12) pour voir la progression
3. Attendez que la barre de progression atteigne 100%

**Si ça freeze vraiment:**
- Fermez les autres onglets du navigateur
- Augmentez la RAM allouée à Node.js:
```bash
node --max-old-space-size=4096 server.js
```

### Q: Les images Google Drive ne s'affichent pas
**R:** Le format de l'URL n'est pas correct.

**Format correct:**
```
https://drive.google.com/uc?export=view&id=VOTRE_ID_ICI
```

**Comment obtenir l'ID:**
```
URL d'origine: https://drive.google.com/file/d/1Mou-TxW2JGz8hOjd2rJoL5NhxEpOT_dx/view
ID à extraire: 1Mou-TxW2JGz8hOjd2rJoL5NhxEpOT_dx
URL finale: https://drive.google.com/uc?export=view&id=1Mou-TxW2JGz8hOjd2rJoL5NhxEpOT_dx
```

---

## 🔄 Mouvements de Stock

### Q: Je ne peux pas faire de sortie, message "Stock insuffisant"
**R:** Vous essayez de retirer plus que la quantité disponible.

**Solution:**
- Vérifiez le stock actuel du produit
- Ajustez la quantité demandée
- Si nécessaire, faites d'abord une entrée de stock

### Q: Les mouvements ne s'enregistrent pas
**R:** Plusieurs causes possibles.

**Vérifications:**
1. Le backend est-il démarré ?
```bash
curl http://localhost:3000/api/products
```

2. Vérifiez les logs backend:
```bash
cd backend
npm start
# Regardez les erreurs éventuelles
```

3. Vérifiez la console navigateur (F12)

### Q: Comment annuler un mouvement par erreur ?
**R:** Il n'y a pas de fonction "annuler" directement.

**Solutions:**
1. **Pour une entrée par erreur:** Faites une sortie de la même quantité
2. **Pour une sortie par erreur:** Faites une entrée de la même quantité
3. **Ou:** Modifiez directement la quantité du produit

---

## 💾 Base de Données et Sauvegardes

### Q: Comment sauvegarder ma base de données ?
**R:** Plusieurs méthodes disponibles.

**Méthode 1: Script intégré**
```bash
cd backend
node backup-database.js backup
```

**Méthode 2: pg_dump manuel**
```bash
pg_dump -U postgres gestion_stock > backup.sql
```

**Méthode 3: Automatique avec cron**
```bash
crontab -e
# Ajouter:
0 2 * * * cd /chemin/vers/backend && node backup-database.js auto
```

### Q: Comment restaurer une sauvegarde ?
**R:** 

```bash
# Méthode 1: Script intégré
cd backend
node backup-database.js restore ./backups/backup_YYYYMMDD_HHMMSS.sql

# Méthode 2: psql manuel
psql -U postgres -d gestion_stock < backup.sql
```

### Q: Les données disparaissent après rafraîchissement
**R:** Vous utilisez peut-être la version sans backend.

**Solutions:**
1. Vérifiez que le backend est démarré:
```bash
cd backend
npm start
```

2. Vérifiez la connexion dans le frontend:
```javascript
// Ouvrir index.html et vérifier:
const API_URL = 'http://localhost:3000/api';
```

3. Vérifiez que PostgreSQL est démarré

---

## 🐳 Docker

### Q: "docker: command not found"
**R:** Docker n'est pas installé.

**Installation:**
```bash
# Linux:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Mac:
# Télécharger Docker Desktop depuis docker.com

# Vérifier:
docker --version
docker-compose --version
```

### Q: "Cannot connect to the Docker daemon"
**R:** Le service Docker n'est pas démarré.

**Solutions:**
```bash
# Linux:
sudo systemctl start docker

# Mac:
# Ouvrir Docker Desktop

# Windows:
# Ouvrir Docker Desktop
```

### Q: Les containers s'arrêtent tout seuls
**R:** Erreur dans la configuration ou les containers.

**Diagnostic:**
```bash
# Voir les logs
docker-compose logs

# Voir l'état des containers
docker-compose ps

# Redémarrer
docker-compose restart
```

---

## 🌐 Déploiement et Production

### Q: Comment déployer en production ?
**R:** Consultez le [Guide de Déploiement](GUIDE_DEPLOIEMENT.md) complet.

**Résumé:**
1. Serveur avec Ubuntu/CentOS
2. Installer Node.js, PostgreSQL, Nginx
3. Configurer SSL avec Let's Encrypt
4. Utiliser PM2 pour gérer le backend
5. Configurer les sauvegardes automatiques

### Q: L'application est lente en production
**R:** Plusieurs optimisations possibles.

**1. Optimiser PostgreSQL:**
```sql
-- Analyser les requêtes lentes
EXPLAIN ANALYZE SELECT * FROM products;

-- Ajouter des index si nécessaire
CREATE INDEX idx_products_name ON products(real_name);
```

**2. Optimiser Node.js:**
```bash
# Utiliser PM2 en mode cluster
pm2 start server.js -i max --name gestion-stock-api
```

**3. Activer la compression Nginx** (déjà fait dans notre config)

**4. Utiliser un CDN** pour les images

### Q: Comment activer HTTPS ?
**R:** Avec Let's Encrypt (gratuit).

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement est automatique
```

---

## 🔐 Sécurité

### Q: Comment sécuriser ma base de données ?
**R:** Plusieurs mesures recommandées.

**1. Mot de passe fort:**
```bash
# Au moins 16 caractères, mélange de lettres, chiffres, symboles
DB_PASSWORD=Xy7$mK9@pL2&nQ5#
```

**2. Limiter les connexions:**
```bash
# Dans pg_hba.conf
local   gestion_stock   gestion_stock_user   md5
# Pas de connexion depuis l'extérieur
```

**3. Firewall:**
```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
# NE PAS autoriser le port 5432 (PostgreSQL)
```

### Q: Dois-je versionner le fichier .env ?
**R:** **NON, JAMAIS !**

Le fichier `.env` contient des informations sensibles (mots de passe).

**Bonne pratique:**
1. `.env` est dans `.gitignore` ✅
2. Créer `.env.example` avec des valeurs factices
3. Documenter les variables dans README

---

## 🧪 Tests et Débogage

### Q: Comment tester si l'API fonctionne ?
**R:** Plusieurs méthodes.

**Méthode 1: Script de test**
```bash
cd backend
node test-api.js
```

**Méthode 2: curl**
```bash
curl http://localhost:3000/api/products
```

**Méthode 3: Navigateur**
```
Ouvrir: http://localhost:3000/api/products
```

### Q: Comment voir les logs en temps réel ?
**R:** 

**Backend direct:**
```bash
cd backend
npm start
# Les logs s'affichent dans le terminal
```

**Avec PM2:**
```bash
pm2 logs gestion-stock-api
```

**Avec Docker:**
```bash
docker-compose logs -f backend
```

### Q: L'application retourne des erreurs 500
**R:** Erreur serveur - vérifier les logs.

**Étapes:**
1. Vérifier les logs backend
2. Vérifier PostgreSQL
3. Vérifier les permissions
4. Vérifier l'espace disque: `df -h`

---

## 💡 Conseils et Bonnes Pratiques

### Q: Quelle est la fréquence recommandée pour les sauvegardes ?
**R:** 

- **Quotidien:** Si usage intensif
- **Hebdomadaire:** Si usage modéré
- **Avant toute mise à jour majeure**
- **Garder 30 dernières sauvegardes**

### Q: Combien de produits peut gérer l'application ?
**R:** 

- **Sans problème:** 10 000+ produits
- **Testé jusqu'à:** 50 000 produits
- **Limite théorique:** Limitée par PostgreSQL (plusieurs millions)

**Pour de très grandes quantités:**
- Ajouter des index supplémentaires
- Optimiser les requêtes
- Augmenter les ressources serveur

### Q: Puis-je utiliser MySQL au lieu de PostgreSQL ?
**R:** Oui, mais nécessite des modifications.

**Étapes:**
1. Modifier `server.js` pour utiliser `mysql2`
2. Adapter les requêtes SQL (syntaxe légèrement différente)
3. Modifier `init-database.js`

**Recommandation:** PostgreSQL est mieux pour ce projet (transactions, performances).

---

## 🆘 Problèmes Courants

### "npm ERR! code ENOENT"
**Cause:** Fichier package.json manquant ou corrompu

**Solution:**
```bash
# Vérifier que vous êtes dans le bon dossier
cd backend
ls package.json

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### "Error: Cannot find module"
**Cause:** Module npm manquant

**Solution:**
```bash
cd backend
npm install
```

### "CORS error" dans le navigateur
**Cause:** Le backend ne permet pas les requêtes depuis le frontend

**Solution:**
Vérifier dans `server.js`:
```javascript
app.use(cors());
```

### Lenteur lors de l'import Excel
**Cause:** Traitement de beaucoup de données

**Solution:** C'est normal. L'import est optimisé par batch de 50 produits.

**Temps moyens:**
- 100 produits: 2-3 sec
- 500 produits: 8-10 sec
- 2000 produits: 30-40 sec

---

## 📞 Besoin d'aide supplémentaire ?

Si votre problème n'est pas listé ici:

1. **Vérifier les logs** en premier
2. **Consulter la documentation** complète
3. **Rechercher dans les Issues GitHub**
4. **Créer une nouvelle Issue** avec:
   - Description du problème
   - Logs d'erreur
   - Version de Node.js, PostgreSQL, OS
   - Étapes pour reproduire

---

**💡 Astuce:** La plupart des problèmes viennent de:
- Backend non démarré ⚠️
- PostgreSQL non démarré ⚠️
- Mauvais mot de passe dans `.env` ⚠️
- Port déjà utilisé ⚠️

Vérifiez toujours ces points en premier ! ✅