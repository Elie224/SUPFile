/**
 * Script pour nettoyer les fichiers et dossiers orphelins
 * Supprime les entrées en base de données dont les fichiers physiques n'existent plus
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
// Ces require enregistrent les modèles Mongoose "File" et "Folder"
require('../models/fileModel');
require('../models/folderModel');
const db = require('../models/db');

async function cleanupOrphanedFiles() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await db.connectionPromise;
    console.log('✅ Connecté à MongoDB');

    // Récupérer les modèles Mongoose bruts
    const File = mongoose.model('File');
    const Folder = mongoose.model('Folder');

    // Récupérer tous les fichiers non supprimés
    const allFiles = await File.find({ is_deleted: false }).lean();
    console.log(`📁 ${allFiles.length} fichiers trouvés en base de données`);

    let deletedCount = 0;
    let keptCount = 0;
    const orphanedFiles = [];

    for (const file of allFiles) {
      try {
        // Vérifier si le fichier existe physiquement
        await fs.access(file.file_path);
        keptCount++;
      } catch (err) {
        // Fichier n'existe pas → orphelin
        console.log(`❌ Fichier orphelin trouvé: ${file.name} (${file.file_path})`);
        orphanedFiles.push(file);
        
        // Marquer comme supprimé dans la base
        await File.findByIdAndUpdate(file._id, {
          is_deleted: true,
          deleted_at: new Date()
        });
        deletedCount++;
      }
    }

    console.log(`\n📊 Résumé du nettoyage:`);
    console.log(`   ✅ Fichiers conservés: ${keptCount}`);
    console.log(`   🗑️  Fichiers orphelins supprimés: ${deletedCount}`);

    // Nettoyer les dossiers vides (sans fichiers et sans sous-dossiers)
    console.log(`\n🔄 Nettoyage des dossiers vides...`);
    const allFolders = await Folder.find({ is_deleted: false }).lean();
    let emptyFoldersDeleted = 0;

    for (const folder of allFolders) {
      // Compter les fichiers dans ce dossier
      const filesInFolder = await File.countDocuments({
        folder_id: folder._id,
        is_deleted: false
      });

      // Compter les sous-dossiers
      const subfolders = await Folder.countDocuments({
        parent_id: folder._id,
        is_deleted: false
      });

      // Si le dossier est vide (sauf le dossier Root)
      if (filesInFolder === 0 && subfolders === 0 && folder.name !== 'Root') {
        console.log(`🗑️  Dossier vide supprimé: ${folder.name}`);
        await Folder.findByIdAndUpdate(folder._id, {
          is_deleted: true,
          deleted_at: new Date()
        });
        emptyFoldersDeleted++;
      }
    }

    console.log(`   🗑️  Dossiers vides supprimés: ${emptyFoldersDeleted}`);

    console.log(`\n✅ Nettoyage terminé !`);
    console.log(`   Total fichiers orphelins supprimés: ${deletedCount}`);
    console.log(`   Total dossiers vides supprimés: ${emptyFoldersDeleted}`);

    // Fermer la connexion
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Lancer le nettoyage
cleanupOrphanedFiles();
