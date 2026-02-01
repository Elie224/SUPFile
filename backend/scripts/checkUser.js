/**
 * Script pour vérifier le statut d'un utilisateur
 * Usage: node scripts/checkUser.js email@example.com
 * Pour supprimer: node scripts/checkUser.js email@example.com --delete
 * Ne pas exécuter en production sur un serveur exposé (utilise MONGO_URI).
 */

require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  console.error('Ce script ne doit pas être exécuté en production (risque d\'accès direct à la base).');
  process.exit(1);
}

const mongoose = require('mongoose');

const MONGODB_URI=[REDACTED] || process.env.MONGODB_URI || 'mongodb://[REDACTED]';
const email = process.argv[2];
const shouldDelete = process.argv[3] === '--delete';

async function checkUser() {
  if (!email) {
    console.log('Usage: node scripts/checkUser.js email@example.com');
    console.log('Pour supprimer: node scripts/checkUser.js email@example.com --delete');
    process.exit(1);
  }

  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connecté à MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      await mongoose.disconnect();
      return;
    }

    console.log('Utilisateur trouvé:');
    console.log('------------------');
    console.log(`  Email: ${user.email}`);
    console.log(`  Prénom: ${user.first_name || 'N/A'}`);
    console.log(`  Nom: ${user.last_name || 'N/A'}`);
    console.log(`  Email vérifié: ${user.email_verified ? '✓ OUI' : '✗ NON'}`);
    console.log(`  Créé le: ${user.created_at || 'N/A'}`);
    console.log(`  Dernière connexion: ${user.last_login || 'Jamais'}`);

    if (shouldDelete) {
      console.log('\nSuppression en cours...');
      const userId = user._id;

      const sessionsCollection = db.collection('sessions');
      const filesCollection = db.collection('files');
      const foldersCollection = db.collection('folders');
      const sharesCollection = db.collection('shares');

      await sessionsCollection.deleteMany({ user_id: userId });
      await sharesCollection.deleteMany({
        $or: [
          { created_by_id: userId },
          { shared_with_user_id: userId }
        ]
      });
      await filesCollection.deleteMany({ owner_id: userId });
      await foldersCollection.deleteMany({ owner_id: userId });
      await usersCollection.deleteOne({ _id: userId });

      // Bloquer l'email pour empêcher toute création de compte futur
      const blockedCollection = db.collection('blockedemails');
      await blockedCollection.updateOne(
        { email: user.email.toLowerCase() },
        { $setOnInsert: { email: user.email.toLowerCase(), created_at: new Date() } },
        { upsert: true }
      );

      console.log(`✓ Utilisateur ${email} supprimé définitivement. Adresse bloquée.`);
    } else {
      console.log('\nPour supprimer cet utilisateur, exécutez:');
      console.log(`  node scripts/checkUser.js ${email} --delete`);
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('Erreur:', error.message);
    process.exit(1);
  }
}

checkUser();
