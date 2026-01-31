const mongoose = require('mongoose');
const crypto = require('crypto');
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String },
  oauth_provider: String,
  oauth_id: String,
  display_name: String,
  avatar_url: String,
  quota_limit: { type: Number, default: 32212254720 }, // 30 Go par défaut (30 * 1024 * 1024 * 1024 bytes)
  quota_used: { type: Number, default: 0 },
  preferences: { type: Schema.Types.Mixed, default: { theme: 'light', language: 'en', notifications_enabled: true } },
  is_active: { type: Boolean, default: true },
  is_admin: { type: Boolean, default: false },
  last_login_at: Date,
  // Champs pour réinitialisation de mot de passe
  reset_password_token: { type: String },
  reset_password_expires: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const UserModel = {
  async findByEmail(email) {
    // Attendre que MongoDB soit connecté
    const mongoose = require('./db');
    const db = mongoose.connection;
    
    if (db.readyState !== 1) {
      // Attendre la connexion (max 10 secondes)
      await new Promise((resolve, reject) => {
        if (db.readyState === 1) {
          resolve();
          return;
        }
        
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 10000);
        
        db.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        db.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
    const u = await User.findOne({ email }).lean();
    if (!u) return null;
    return {
      id: u._id.toString(),
      email: u.email,
      password_hash: u.password_hash,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      quota_limit: u.quota_limit,
      quota_used: u.quota_used,
      preferences: u.preferences,
      is_admin: u.is_admin || false,
      created_at: this.correctDate(u.created_at),
      last_login_at: this.correctDate(u.last_login_at),
    };
  },

  async findById(id) {
    // Vérifier que MongoDB est connecté
    const mongoose = require('./db');
    const db = mongoose.connection;
    
    if (db.readyState !== 1) {
      throw new Error('MongoDB is not connected');
    }
    const u = await User.findById(id).lean();
    if (!u) return null;
    return {
      id: u._id.toString(),
      email: u.email,
      password_hash: u.password_hash,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      quota_limit: u.quota_limit,
      quota_used: u.quota_used,
      preferences: u.preferences,
      is_admin: u.is_admin || false,
      created_at: this.correctDate(u.created_at),
      last_login_at: this.correctDate(u.last_login_at),
    };
  },

  async create({ email, passwordHash, display_name = null, avatar_url = null, oauth_provider = null, oauth_id = null }) {
    // Attendre que MongoDB soit connecté
    const mongoose = require('./db');
    const db = mongoose.connection;
    
    if (db.readyState !== 1) {
      // Attendre la connexion (max 10 secondes)
      await new Promise((resolve, reject) => {
        if (db.readyState === 1) {
          resolve();
          return;
        }
        
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 10000);
        
        db.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        db.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }
    const u = new User({ 
      email, 
      password_hash: passwordHash, 
      display_name, 
      avatar_url,
      oauth_provider,
      oauth_id
    });
    const saved = await u.save();
    return {
      id: saved._id.toString(),
      email: saved.email,
      display_name: saved.display_name,
      avatar_url: saved.avatar_url,
      quota_limit: saved.quota_limit,
      quota_used: saved.quota_used,
      preferences: saved.preferences,
      created_at: this.correctDate(saved.created_at),
    };
  },

  async updateLastLogin(id) {
    await User.findByIdAndUpdate(id, { last_login_at: new Date() });
  },

  async updateQuotaUsed(id, quotaUsed) {
    await User.findByIdAndUpdate(id, { quota_used: quotaUsed });
  },

  async updatePreferences(id, preferences) {
    await User.findByIdAndUpdate(id, { preferences });
  },

  /**
   * Génère un token de réinitialisation de mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {Object} Token et expiration
   */
  async generateResetToken(email) {
    const user = await User.findOne({ email });
    if (!user) return null;

    // Générer un token aléatoire
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash le token pour le stocker en base
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Expiration dans 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      reset_password_token: hashedToken,
      reset_password_expires: expiresAt,
    });

    return {
      token: resetToken, // On retourne le token non hashé pour l'envoyer par email
      expiresAt,
      userId: user._id.toString(),
    };
  },

  /**
   * Vérifie un token de réinitialisation
   * @param {string} token - Token reçu
   * @returns {Object|null} Utilisateur si token valide
   */
  async verifyResetToken(token) {
    // Hash le token reçu pour comparaison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Token valide uniquement si non expiré : après 15 minutes, plus aucun accès
    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: new Date() },
    }).lean();

    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
    };
  },

  /**
   * Réinitialise le mot de passe avec un token valide
   * @param {string} token - Token de réinitialisation
   * @param {string} newPasswordHash - Nouveau mot de passe hashé
   * @returns {boolean} Succès ou échec
   */
  async resetPassword(token, newPasswordHash) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: new Date() },
    });

    if (!user) return false;

    user.password_hash = newPasswordHash;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();

    return true;
  },

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param {string} id - ID de l'utilisateur
   * @param {string} passwordHash - Nouveau mot de passe hashé
   */
  async updatePassword(id, passwordHash) {
    await User.findByIdAndUpdate(id, { 
      password_hash: passwordHash,
      reset_password_token: undefined,
      reset_password_expires: undefined,
    });
  },

  /**
   * Corrige une date si elle est en 2026 (remplace par 2025)
   * @param {Date} date - Date à corriger
   * @returns {Date} Date corrigée
   */
  correctDate(date) {
    if (!date) return date;
    const dateObj = new Date(date);
    if (dateObj.getFullYear() === 2026) {
      dateObj.setFullYear(2025);
    }
    return dateObj;
  },
};

module.exports = UserModel;
