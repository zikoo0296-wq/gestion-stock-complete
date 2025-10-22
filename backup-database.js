const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_NAME = process.env.DB_NAME || 'gestion_stock';
const DB_PASSWORD = process.env.DB_PASSWORD;
const KEEP_BACKUPS = parseInt(process.env.KEEP_BACKUPS) || 7; // Garder 7 dernières sauvegardes

// Créer le dossier de sauvegarde s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Dossier de sauvegarde créé: ${BACKUP_DIR}`);
}

// Générer le nom du fichier avec la date
const getBackupFileName = () => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `backup_${DB_NAME}_${dateStr}_${timeStr}.sql`;
};

// Fonction pour créer une sauvegarde
const createBackup = () => {
  return new Promise((resolve, reject) => {
    const fileName = getBackupFileName();
    const filePath = path.join(BACKUP_DIR, fileName);
    
    console.log('🔄 Démarrage de la sauvegarde...');
    console.log(`📝 Fichier: ${fileName}`);
    
    // Commande pg_dump avec mot de passe via PGPASSWORD
    const command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -F c -f "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error.message);
        reject(error);
        return;
      }
      
      if (stderr && !stderr.includes('pg_dump: warning')) {
        console.error('⚠️  Avertissement:', stderr);
      }
      
      // Vérifier que le fichier existe et a une taille > 0
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log('✅ Sauvegarde créée avec succès!');
        console.log(`📊 Taille: ${fileSizeMB} MB`);
        console.log(`📍 Emplacement: ${filePath}`);
        
        resolve(filePath);
      } else {
        reject(new Error('Le fichier de sauvegarde n\'a pas été créé'));
      }
    });
  });
};

// Fonction pour nettoyer les anciennes sauvegardes
const cleanOldBackups = () => {
  console.log('\n🧹 Nettoyage des anciennes sauvegardes...');
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Tri par date décroissante
    
    console.log(`📋 ${files.length} sauvegarde(s) trouvée(s)`);
    
    if (files.length > KEEP_BACKUPS) {
      const filesToDelete = files.slice(KEEP_BACKUPS);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Supprimé: ${file.name}`);
      });
      
      console.log(`✅ ${filesToDelete.length} ancienne(s) sauvegarde(s) supprimée(s)`);
      console.log(`📦 ${KEEP_BACKUPS} sauvegarde(s) conservée(s)`);
    } else {
      console.log('✅ Aucune sauvegarde à supprimer');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
};

// Fonction pour restaurer une sauvegarde
const restoreBackup = (backupFile) => {
  return new Promise((resolve, reject) => {
    console.log('\n🔄 Restauration de la sauvegarde...');
    console.log(`📝 Fichier: ${backupFile}`);
    
    if (!fs.existsSync(backupFile)) {
      reject(new Error(`Le fichier ${backupFile} n'existe pas`));
      return;
    }
    
    const command = `PGPASSWORD="${DB_PASSWORD}" pg_restore -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -c "${backupFile}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error && !error.message.includes('pg_restore: warning')) {
        console.error('❌ Erreur lors de la restauration:', error.message);
        reject(error);
        return;
      }
      
      console.log('✅ Sauvegarde restaurée avec succès!');
      resolve();
    });
  });
};

// Fonction pour lister les sauvegardes
const listBackups = () => {
  console.log('\n📋 Liste des sauvegardes disponibles:');
  console.log('─'.repeat(80));
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          date: stats.mtime.toLocaleString('fr-FR')
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (files.length === 0) {
      console.log('Aucune sauvegarde trouvée');
      return [];
    }
    
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   📊 Taille: ${file.size} | 📅 Date: ${file.date}`);
    });
    
    console.log('─'.repeat(80));
    console.log(`Total: ${files.length} sauvegarde(s)\n`);
    
    return files;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return [];
  }
};

// Script principal
const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         🗄️  GESTION DES SAUVEGARDES DE LA BDD           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    switch (command) {
      case 'backup':
      case 'create':
        await createBackup();
        cleanOldBackups();
        break;
      
      case 'restore':
        const backupFile = args[1];
        if (!backupFile) {
          console.error('❌ Usage: node backup-database.js restore <chemin_du_fichier>');
          process.exit(1);
        }
        await restoreBackup(backupFile);
        break;
      
      case 'list':
        listBackups();
        break;
      
      case 'clean':
        cleanOldBackups();
        break;
      
      case 'auto':
        // Mode automatique pour cron
        await createBackup();
        cleanOldBackups();
        break;
      
      default:
        console.log('📚 Usage:');
        console.log('  node backup-database.js backup     - Créer une sauvegarde');
        console.log('  node backup-database.js restore <fichier> - Restaurer une sauvegarde');
        console.log('  node backup-database.js list       - Lister les sauvegardes');
        console.log('  node backup-database.js clean      - Nettoyer les anciennes sauvegardes');
        console.log('  node backup-database.js auto       - Mode automatique (pour cron)');
        console.log('\n💡 Conseil: Ajoutez cette commande à votre crontab pour des sauvegardes automatiques');
        console.log('   Exemple: 0 2 * * * cd /chemin/vers/projet && node backup-database.js auto');
        process.exit(0);
    }
    
    console.log('\n✨ Opération terminée avec succès!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
};

// Exécuter le script
if (require.main === module) {
  main();
}


module.exports = { createBackup, restoreBackup, listBackups, cleanOldBackups };
import { supabase } from './supabase-config.js'

async function backupProduits() {
  const { data, error } = await supabase.from('produits').select('*')
  if (error) {
    console.error(error)
  } else {
    console.log('📦 Liste des produits sauvegardés:', data)
  }
}

backupProduits()
