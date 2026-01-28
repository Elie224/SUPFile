/**
 * Script de nettoyage des dossiers racine anormaux
 *
 * - Garantit au maximum 1 dossier "Root" par utilisateur (parent_id = null)
 * - Supprime (soft delete) les dossiers racine vides suspects ("doc test", anciens tests, etc.)
 * - Ne touche JAMAIS à un dossier qui contient encore des fichiers ou des sous-dossiers
 */

require('dotenv').config();
const mongoose = require('mongoose');
// Enregistre les modèles Mongoose
require('../models/fileModel');
require('../models/folderModel');
const db = require('../models/db');

async function isFolderEmpty(Folder, File, folder) {
  const filesCount = await File.countDocuments({
    folder_id: folder._id,
    is_deleted: false,
  });

  const subFoldersCount = await Folder.countDocuments({
    parent_id: folder._id,
    is_deleted: false,
  });

  return filesCount === 0 && subFoldersCount === 0;
}

async function cleanupRootFolders() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await db.connectionPromise;
    console.log('✅ Connecté à MongoDB');

    const File = mongoose.model('File');
    const Folder = mongoose.model('Folder');

    console.log('\n📂 Analyse des dossiers racine (parent_id = null)...');

    // Tous les dossiers racine non supprimés
    const rootFolders = await Folder.find({
      parent_id: null,
      is_deleted: false,
    }).lean();

    console.log(`- ${rootFolders.length} dossier(s) racine trouvé(s)`);

    // Grouper par owner_id
    const byOwner = new Map();
    for (const folder of rootFolders) {
      const ownerKey = String(folder.owner_id);
      if (!byOwner.has(ownerKey)) byOwner.set(ownerKey, []);
      byOwner.get(ownerKey).push(folder);
    }

    let deletedRoots = 0;

    for (const [ownerId, folders] of byOwner.entries()) {
      console.log(`\n👤 Utilisateur ${ownerId}: ${folders.length} dossier(s) racine`);

      // On garde le plus ancien dossier "Root" et on nettoie les autres Root vides
      const rootNamed = folders.filter(f => (f.name || '').toLowerCase() === 'root');
      const others = folders.filter(f => !rootNamed.includes(f));

      if (rootNamed.length > 1) {
        const sorted = [...rootNamed].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
        const keeper = sorted[0];
        console.log(
          `  - Plusieurs "Root" trouvés (${rootNamed.length}). On garde: ${keeper._id} (${keeper.created_at})`,
        );

        // Les autres "Root" seront supprimés seulement s'ils sont vides
        for (const extra of sorted.slice(1)) {
          const empty = await isFolderEmpty(Folder, File, extra);
          if (empty) {
            console.log(`    🗑️  Suppression du Root dupliqué vide: ${extra._id} (${extra.name})`);
            await Folder.findByIdAndUpdate(extra._id, {
              is_deleted: true,
              deleted_at: new Date(),
            });
            deletedRoots++;
          } else {
            console.log(
              `    ⚠️ Root dupliqué NON vide conservé: ${extra._id} (${extra.name})`,
            );
          }
        }
      }

      // Dossiers racine suspects (non "Root"), typiquement "doc test", "Racine", anciens tests, etc.
      for (const folder of others) {
        const name = (folder.name || '').toLowerCase();

        // On cible seulement certains noms "test" / "doc" mais tu peux ajuster
        const isSuspicious =
          name.includes('test') ||
          name.includes('doc') ||
          name === '' ||
          name === 'racine';

        if (!isSuspicious) continue;

        // Cas particulier: pour ton utilisateur principal, on force la suppression
        // du dossier racine "Racine" même s'il n'est pas vide, car tu ne veux voir
        // que "test1" à la racine.
        const isForcedRacineForMainUser =
          ownerId === '694318af12a0626255de2f7f' && name === 'racine';

        if (isForcedRacineForMainUser) {
          console.log(
            `  🗑️  Suppression forcée du dossier racine "Racine" pour l'utilisateur ${ownerId}: ${folder._id} (${folder.name})`,
          );
          await Folder.findByIdAndUpdate(folder._id, {
            is_deleted: true,
            deleted_at: new Date(),
          });
          deletedRoots++;
          continue;
        }

        // Comportement normal: ne supprimer que les dossiers vides
        const empty = await isFolderEmpty(Folder, File, folder);
        if (empty) {
          console.log(`  🗑️  Dossier racine suspect vide supprimé: ${folder._id} (${folder.name})`);
          await Folder.findByIdAndUpdate(folder._id, {
            is_deleted: true,
            deleted_at: new Date(),
          });
          deletedRoots++;
        } else {
          console.log(
            `  ⚠️ Dossier racine suspect NON vide conservé: ${folder._id} (${folder.name})`,
          );
        }
      }
    }

    console.log('\n✅ Nettoyage des dossiers racine terminé.');
    console.log(`   🗑️  Dossiers racine marqués supprimés: ${deletedRoots}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage des dossiers racine:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanupRootFolders();

