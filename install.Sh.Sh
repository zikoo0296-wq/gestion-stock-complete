#!/bin/bash

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       🏪  GESTION DE STOCK PRO - INSTALLATION          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Fonction pour afficher les messages
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier si on est root
if [ "$EUID" -eq 0 ]; then 
    error "Ne pas exécuter ce script en tant que root"
    exit 1
fi

# Fonction pour vérifier les commandes
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Détection de l'OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            OS="debian"
        elif [ -f /etc/redhat-release ]; then
            OS="redhat"
        else
            OS="linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        OS="unknown"
    fi
    info "Système détecté: $OS"
}

# Installation de Node.js
install_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version)
        success "Node.js déjà installé: $NODE_VERSION"
        return 0
    fi

    info "Installation de Node.js..."
    
    if [ "$OS" == "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" == "redhat" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif [ "$OS" == "macos" ]; then
        if command_exists brew; then
            brew install node
        else
            error "Homebrew n'est pas installé. Installez-le depuis https://brew.sh"
            exit 1
        fi
    fi

    if command_exists node; then
        success "Node.js installé: $(node --version)"
    else
        error "Échec de l'installation de Node.js"
        exit 1
    fi
}

# Installation de PostgreSQL
install_postgresql() {
    if command_exists psql; then
        PSQL_VERSION=$(psql --version | awk '{print $3}')
        success "PostgreSQL déjà installé: $PSQL_VERSION"
        return 0
    fi

    info "Installation de PostgreSQL..."
    
    if [ "$OS" == "debian" ]; then
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [ "$OS" == "redhat" ]; then
        sudo yum install -y postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [ "$OS" == "macos" ]; then
        if command_exists brew; then
            brew install postgresql@14
            brew services start postgresql@14
        else
            error "Homebrew requis pour macOS"
            exit 1
        fi
    fi

    if command_exists psql; then
        success "PostgreSQL installé: $(psql --version | awk '{print $3}')"
    else
        error "Échec de l'installation de PostgreSQL"
        exit 1
    fi
}

# Configuration de PostgreSQL
setup_database() {
    info "Configuration de la base de données..."
    
    read -p "Entrez le nom de la base de données [gestion_stock]: " DB_NAME
    DB_NAME=${DB_NAME:-gestion_stock}
    
    read -p "Entrez le nom d'utilisateur PostgreSQL [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -sp "Entrez le mot de passe PostgreSQL: " DB_PASSWORD
    echo
    
    if [ -z "$DB_PASSWORD" ]; then
        error "Le mot de passe ne peut pas être vide"
        exit 1
    fi

    # Créer la base de données
    info "Création de la base de données..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || warning "La base de données existe peut-être déjà"
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null

    success "Base de données configurée"
}

# Installation du backend
install_backend() {
    info "Installation du backend..."
    
    cd backend || exit 1
    
    # Créer le fichier .env
    cat > .env << EOF
DB_USER=$DB_USER
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASSWORD
DB_PORT=5432
PORT=3000
NODE_ENV=development
BACKUP_DIR=./backups
KEEP_BACKUPS=7
EOF

    success "Fichier .env créé"
    
    # Installer les dépendances
    info "Installation des dépendances npm..."
    npm install
    
    if [ $? -eq 0 ]; then
        success "Dépendances installées"
    else
        error "Échec de l'installation des dépendances"
        exit 1
    fi
    
    # Initialiser la base de données
    info "Initialisation de la base de données..."
    node init-database.js
    
    if [ $? -eq 0 ]; then
        success "Base de données initialisée"
    else
        error "Échec de l'initialisation de la base de données"
        exit 1
    fi
    
    cd ..
}

# Installation de PM2 (optionnel)
install_pm2() {
    read -p "Voulez-vous installer PM2 pour gérer le backend en production? (o/N): " install_pm2
    if [[ $install_pm2 == "o" || $install_pm2 == "O" ]]; then
        info "Installation de PM2..."
        sudo npm install -g pm2
        success "PM2 installé"
        
        info "Configuration de PM2..."
        cd backend
        pm2 start server.js --name gestion-stock-api
        pm2 save
        pm2 startup
        cd ..
        success "Backend démarré avec PM2"
    fi
}

# Test de l'installation
test_installation() {
    info "Test de l'installation..."
    
    cd backend
    node test-api.js &
    TEST_PID=$!
    
    # Démarrer le serveur temporairement
    node server.js &
    SERVER_PID=$!
    
    sleep 5
    
    # Tester l'API
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/products)
    
    if [ "$RESPONSE" == "200" ]; then
        success "✅ API fonctionne correctement"
    else
        warning "⚠️  L'API ne répond pas correctement"
    fi
    
    # Arrêter le serveur de test
    kill $SERVER_PID 2>/dev/null
    kill $TEST_PID 2>/dev/null
    
    cd ..
}

# Afficher les informations finales
show_final_info() {
    echo
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          🎉 INSTALLATION TERMINÉE AVEC SUCCÈS !          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}📋 Informations importantes:${NC}"
    echo -e "   ${BLUE}•${NC} Base de données: $DB_NAME"
    echo -e "   ${BLUE}•${NC} Utilisateur: $DB_USER"
    echo -e "   ${BLUE}•${NC} Port backend: 3000"
    echo
    echo -e "${CYAN}🚀 Pour démarrer l'application:${NC}"
    echo -e "   ${YELLOW}cd backend && npm start${NC}"
    echo
    echo -e "${CYAN}🌐 URLs:${NC}"
    echo -e "   ${BLUE}•${NC} API: ${GREEN}http://localhost:3000/api${NC}"
    echo -e "   ${BLUE}•${NC} Frontend: ${GREEN}Ouvrir frontend/index.html${NC}"
    echo
    echo -e "${CYAN}📚 Documentation:${NC}"
    echo -e "   ${BLUE}•${NC} Guide d'installation: docs/GUIDE_INSTALLATION.md"
    echo -e "   ${BLUE}•${NC} Guide de déploiement: docs/GUIDE_DEPLOIEMENT.md"
    echo
    echo -e "${CYAN}🔧 Commandes utiles:${NC}"
    echo -e "   ${YELLOW}npm start${NC}              - Démarrer le backend"
    echo -e "   ${YELLOW}npm run init-db${NC}        - Réinitialiser la BDD"
    echo -e "   ${YELLOW}node backup-database.js${NC} - Sauvegarder la BDD"
    echo -e "   ${YELLOW}node test-api.js${NC}       - Tester l'API"
    echo
    echo -e "${CYAN}💡 Conseil:${NC}"
    echo -e "   Sauvegardez votre fichier ${YELLOW}.env${NC} dans un endroit sûr !"
    echo
}

# Menu principal
main() {
    detect_os
    echo
    
    info "Début de l'installation..."
    echo
    
    # Étapes d'installation
    install_nodejs
    install_postgresql
    setup_database
    install_backend
    
    # Options
    install_pm2
    
    # Test
    test_installation
    
    # Informations finales
    show_final_info
}

# Point d'entrée
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: ./install.sh"
    echo
    echo "Ce script installe automatiquement:"
    echo "  - Node.js"
    echo "  - PostgreSQL"
    echo "  - Les dépendances du projet"
    echo "  - Configure la base de données"
    echo "  - (Optionnel) PM2 pour la gestion du serveur"
    echo
    exit 0
fi

# Vérifier si on est dans le bon dossier
if [ ! -f "backend/package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
    echo "Assurez-vous d'être dans le dossier contenant 'backend/' et 'frontend/'"
    exit 1
fi

# Exécuter l'installation
main