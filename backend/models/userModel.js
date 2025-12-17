const mongoose = require('mongoose');
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
      created_at: u.created_at,
      last_login_at: u.last_login_at,
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
      created_at: u.created_at,
      last_login_at: u.last_login_at,
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
      created_at: saved.created_at,
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
};

module.exports = UserModel;
