/**
 * Script pour supprimer tous les utilisateurs qui n'ont pas vérifié leur email
 * Usage: node scripts/cleanUnverifiedUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI=[REDACTED] || 'mongodb://[REDACTED]';

async function cleanUnverifiedUsers() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connecté à MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Compter les utilisateurs non vérifiés
    const countBefore = await usersCollection.countDocuments({ email_verified: false });
    console.log(`\nUtilisateurs non vérifiés trouvés: ${countBefore}`);

    if (countBefore === 0) {
      console.log('Aucun utilisateur non vérifié à supprimer.');
      await mongoose.disconnect();
      return;
    }

    // Lister les emails qui seront supprimés
    const unverifiedUsers = await usersCollection.find(
      { email_verified: false },
      { projection: { email: 1, created_at: 1 } }
    ).toArray();

    console.log('\nComptes qui seront supprimés:');
    unverifiedUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (créé le: ${user.created_at || 'N/A'})`);
    });

    // Supprimer les utilisateurs non vérifiés
    const result = await usersCollection.deleteMany({ email_verified: false });
    console.log(`\n✓ ${result.deletedCount} utilisateur(s) non vérifié(s) supprimé(s)`);

    // Aussi supprimer les sessions associées (si elles existent)
    const sessionsCollection = db.collection('sessions');
    const userIds = unverifiedUsers.map(u => u._id);
    const sessionsResult = await sessionsCollection.deleteMany({ user_id: { $in: userIds } });
    if (sessionsResult.deletedCount > 0) {
      console.log(`✓ ${sessionsResult.deletedCount} session(s) associée(s) supprimée(s)`);
    }

    await mongoose.disconnect();
    console.log('\n✓ Nettoyage terminé');

  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

cleanUnverifiedUsers();
