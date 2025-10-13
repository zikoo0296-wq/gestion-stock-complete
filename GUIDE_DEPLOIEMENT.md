# 🚀 Guide de Déploiement en Production

## 📋 Table des matières
1. [Préparation](#préparation)
2. [Déploiement avec Docker](#déploiement-avec-docker)
3. [Déploiement manuel](#déploiement-manuel)
4. [Configuration SSL/HTTPS](#configuration-ssl)
5. [Monitoring](#monitoring)
6. [Sauvegardes automatiques](#sauvegardes)
7. [Maintenance](#maintenance)

---

## 🔧 Préparation

### Serveur requis
- **OS**: Ubuntu 20.04/22.04 LTS ou CentOS 8+
- **RAM**: Minimum 2GB (4GB recommandé)
- **CPU**: 2 cores minimum
- **Disque**: 20GB minimum (+ espace pour les sauvegardes)
- **Bande passante**: Illimitée recommandée

### Nom de domaine
- Acheter un nom de domaine (ex: mon-stock.com)
- Configurer les DNS pour pointer vers l'IP de votre serveur

---

## 🐳 Déploiement avec Docker (RECOMMANDÉ)

### 1. Installer Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Préparer les fichiers

```bash
# Créer la structure
mkdir -p /opt/gestion-stock
cd /opt/gestion-stock

# Créer les dossiers
mkdir -p backend frontend backups
```

**Copier les fichiers suivants :**
- `docker-compose.yml` → `/opt/gestion-stock/`
- `backend/` (tous les fichiers) → `/opt/gestion-stock/backend/`
- `frontend/index.html` → `/opt/gestion-stock/frontend/`
- `nginx.conf` → `/opt/gestion-stock/`

### 3. Configuration

**Créer le fichier `.env` :**
```bash
nano /opt/gestion-stock/.env
```

```bash
# Base de données
DB_USER=postgres
DB_PASSWORD=CHANGER_MOI_MOT_DE_PASSE_FORT
DB_NAME=gestion_stock
DB_HOST=postgres
DB_PORT=5432

# Backend
PORT=3000
NODE_ENV=production

# Backup
BACKUP_DIR=/backups
KEEP_BACKUPS=30
```

**⚠️ IMPORTANT :** Changez `CHANGER_MOI_MOT_DE_PASSE_FORT` par un mot de passe sécurisé !

### 4. Modifier la configuration frontend

**Éditer `frontend/index.html` :**
```javascript
// Changer cette ligne :
const API_URL = 'http://localhost:3000/api';

// En :
const API_URL = 'https://votre-domaine.com/api';
// OU pour test sans HTTPS :
const API_URL = 'http://votre-ip:3000/api';
```

### 5. Lancer l'application

```bash
cd /opt/gestion-stock

# Construire et démarrer
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

### 6. Initialiser la base de données

```bash
# Se connecter au container backend
docker-compose exec backend sh

# Initialiser la BDD
node init-database.js

# Sortir du container
exit
```

### 7. Tester l'application

```bash
# Tester l'API
curl http://localhost:3000/api/products

# Ouvrir dans le navigateur
# http://votre-ip ou http://votre-domaine.com
```

---

## 🔨 Déploiement manuel (Sans Docker)

### 1. Préparer le serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer Nginx
sudo apt install -y nginx

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2
```

### 2. Configurer PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer l'utilisateur et la base
CREATE USER gestion_stock_user WITH PASSWORD 'MOT_DE_PASSE_FORT';
CREATE DATABASE gestion_stock OWNER gestion_stock_user;
GRANT ALL PRIVILEGES ON DATABASE gestion_stock TO gestion_stock_user;
\q

# Autoriser les connexions locales
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ajouter: local   gestion_stock   gestion_stock_user   md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

### 3. Déployer le Backend

```bash
# Créer le dossier
sudo mkdir -p /var/www/gestion-stock/backend
cd /var/www/gestion-stock/backend

# Copier les fichiers backend
# (via SCP, FTP, ou Git)

# Installer les dépendances
npm install --production

# Créer le fichier .env
nano .env
```

```bash
DB_USER=gestion_stock_user
DB_HOST=localhost
DB_NAME=gestion_stock
DB_PASSWORD=MOT_DE_PASSE_FORT
DB_PORT=5432
PORT=3000
NODE_ENV=production
```

```bash
# Initialiser la base de données
node init-database.js

# Démarrer avec PM2
pm2 start server.js --name gestion-stock-api
pm2 save
pm2 startup
```

### 4. Configurer Nginx

```bash
# Créer la configuration
sudo nano /etc/nginx/sites-available/gestion-stock
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /var/www/gestion-stock/frontend;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/gestion-stock /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 5. Déployer le Frontend

```bash
# Copier le frontend
sudo mkdir -p /var/www/gestion-stock/frontend
sudo cp index.html /var/www/gestion-stock/frontend/

# Modifier l'URL de l'API dans index.html
sudo nano /var/www/gestion-stock/frontend/index.html
# Changer: const API_URL = 'http://votre-domaine.com/api';

# Permissions
sudo chown -R www-data:www-data /var/www/gestion-stock
```

---

## 🔒 Configuration SSL/HTTPS avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le certificat se renouvelle automatiquement
# Tester le renouvellement :
sudo certbot renew --dry-run
```

---

## 📊 Monitoring et Logs

### PM2 (si déploiement manuel)

```bash
# Voir les logs
pm2 logs gestion-stock-api

# Monitoring en temps réel
pm2 monit

# Redémarrer l'application
pm2 restart gestion-stock-api

# Arrêter l'application
pm2 stop gestion-stock-api
```

### Docker

```bash
# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Statistiques des containers
docker stats

# Redémarrer un service
docker-compose restart backend
```

### Logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreurs
sudo tail -f /var/log/nginx/error.log
```

### Logs PostgreSQL

```bash
# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 💾 Sauvegardes automatiques

### Avec Cron (Déploiement manuel)

```bash
# Éditer le crontab
crontab -e

# Ajouter ces lignes :
# Sauvegarde quotidienne à 2h du matin
0 2 * * * cd /var/www/gestion-stock/backend && node backup-database.js auto >> /var/log/backup.log 2>&1

# Sauvegarde hebdomadaire le dimanche à 3h
0 3 * * 0 cd /var/www/gestion-stock/backend && node backup-database.js auto >> /var/log/backup-weekly.log 2>&1
```

### Avec Docker

```bash
# Créer un script de sauvegarde
nano /opt/gestion-stock/backup-cron.sh
```

```bash
#!/bin/bash
cd /opt/gestion-stock
docker-compose exec -T postgres pg_dump -U postgres gestion_stock > backups/backup_$(date +%Y%m%d_%H%M%S).sql
find backups/ -name "backup_*.sql" -mtime +30 -delete
```

```bash
# Rendre exécutable
chmod +x /opt/gestion-stock/backup-cron.sh

# Ajouter au crontab
crontab -e
# Ajouter :
0 2 * * * /opt/gestion-stock/backup-cron.sh >> /var/log/backup-docker.log 2>&1
```

### Sauvegarde vers le cloud

```bash
# Installer rclone pour sauvegardes cloud (Google Drive, Dropbox, etc.)
curl https://rclone.org/install.sh | sudo bash

# Configurer rclone
rclone config

# Script de sauvegarde cloud
nano /opt/gestion-stock/backup-to-cloud.sh
```

```bash
#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
cd /opt/gestion-stock
docker-compose exec -T postgres pg_dump -U postgres gestion_stock > backups/$BACKUP_FILE
rclone copy backups/$BACKUP_FILE mon-cloud:gestion-stock-backups/
```

---

## 🔧 Maintenance

### Mise à jour de l'application

**Avec Docker :**
```bash
cd /opt/gestion-stock

# Sauvegarder la BDD avant
docker-compose exec postgres pg_dump -U postgres gestion_stock > backup_before_update.sql

# Arrêter les services
docker-compose down

# Mettre à jour les fichiers
# (via Git pull, SCP, etc.)

# Reconstruire et redémarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f
```

**Manuel :**
```bash
cd /var/www/gestion-stock/backend

# Sauvegarder
node backup-database.js backup

# Arrêter l'application
pm2 stop gestion-stock-api

# Mettre à jour les fichiers
git pull  # ou copier les nouveaux fichiers

# Installer les dépendances
npm install --production

# Redémarrer
pm2 restart gestion-stock-api
```

### Restaurer une sauvegarde

**Avec Docker :**
```bash
cd /opt/gestion-stock
docker-compose exec -T postgres psql -U postgres gestion_stock < backups/backup_YYYYMMDD_HHMMSS.sql
```

**Manuel :**
```bash
psql -U gestion_stock_user -d gestion_stock -f /chemin/vers/backup.sql
```

### Nettoyer l'espace disque

```bash
# Nettoyer les logs Docker
docker system prune -a --volumes

# Nettoyer les anciennes sauvegardes (garder 30 jours)
find /opt/gestion-stock/backups/ -name "backup_*.sql" -mtime +30 -delete

# Nettoyer les logs système
sudo journalctl --vacuum-time=7d
```

---

## 🔐 Sécurité en Production

### Firewall (UFW)

```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Autoriser PostgreSQL seulement en local (pas depuis l'extérieur)
# Ne PAS exécuter: sudo ufw allow 5432/tcp

# Vérifier le statut
sudo ufw status
```

### Fail2ban (Protection contre les attaques)

```bash
# Installer Fail2ban
sudo apt install -y fail2ban

# Configurer
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
```

```bash
# Démarrer Fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Sécuriser PostgreSQL

```bash
# Éditer pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# S'assurer que seules les connexions locales sont autorisées
# local   all   all   peer
# host    all   all   127.0.0.1/32   md5

# Éditer postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# S'assurer que PostgreSQL écoute seulement en local
# listen_addresses = 'localhost'

# Redémarrer
sudo systemctl restart postgresql
```

---

## 📈 Performance

### Optimiser PostgreSQL

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```ini
# Pour un serveur avec 4GB RAM
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Optimiser Nginx

```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Cache
    open_file_cache max=200000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Buffers
    client_body_buffer_size 128k;
    client_max_body_size 50m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;

    # Timeouts
    client_header_timeout 3m;
    client_body_timeout 3m;
    send_timeout 3m;
    
    # Gzip
    gzip on;
    gzip_min_length 1000;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

---

## ✅ Checklist de déploiement

- [ ] Serveur configuré et à jour
- [ ] Docker installé (ou Node.js + PostgreSQL + Nginx)
- [ ] Nom de domaine configuré
- [ ] Application déployée
- [ ] Base de données initialisée
- [ ] SSL/HTTPS configuré (Let's Encrypt)
- [ ] Firewall activé (UFW)
- [ ] Fail2ban installé
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring configuré (logs)
- [ ] Test de l'application en production
- [ ] Test de restauration de sauvegarde
- [ ] Documentation des accès notée en lieu sûr

---

## 🆘 Support et Dépannage

### Logs importants à vérifier

```bash
# Backend (Docker)
docker-compose logs backend

# Backend (PM2)
pm2 logs gestion-stock-api

# Nginx
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Système
sudo journalctl -xe
```

### Commandes utiles

```bash
# Redémarrer tous les services (Docker)
docker-compose restart

# Redémarrer tous les services (Manuel)
sudo systemctl restart postgresql
sudo systemctl restart nginx
pm2 restart all

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h

# Vérifier les processus
top
htop  # si installé
```

---

## 🎉 Félicitations !

Votre application est maintenant en production !

**URLs importantes :**
- Frontend: https://votre-domaine.com
- API: https://votre-domaine.com/api
- Santé: https://votre-domaine.com/health

**Pensez à :**
- Tester régulièrement les sauvegardes
- Surveiller les logs
- Mettre à jour régulièrement le système
- Monitorer les performances