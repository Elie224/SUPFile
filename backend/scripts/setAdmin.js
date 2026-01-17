/**
 * Script pour définir <SUPER_ADMIN_EMAIL> comme administrateur
 * Usage: node backend/scripts/setAdmin.js
 */

const mongoose = require('mongoose');
const config = require('../config');
const db = require('../models/db');

// Charger le schéma User avant de l'utiliser
require('../models/userModel');

async function setAdmin() {
  try {
    // Attendre la connexion MongoDB
    await db.connectionPromise;
    console.log('✅ Connexion MongoDB établie');

    // Le modèle User est maintenant chargé via require('../models/userModel')
    const User = mongoose.models.User;
    
    if (!User) {
      throw new Error('Le modèle User n\'a pas été trouvé. Vérifiez que le schéma est correctement chargé.');
    }

    const adminEmail = '<SUPER_ADMIN_EMAIL>';

    // Trouver l'utilisateur
    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log(`❌ Utilisateur ${adminEmail} non trouvé`);
      console.log('   Veuillez d\'abord créer cet utilisateur via l\'interface d\'inscription.');
      process.exit(1);
    }

    // Vérifier si déjà admin
    if (user.is_admin) {
      console.log(`ℹ️  ${adminEmail} est déjà administrateur`);
      process.exit(0);
    }

    // Définir comme admin
    user.is_admin = true;
    await user.save();

    console.log(`✅ ${adminEmail} est maintenant administrateur`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setAdmin();


