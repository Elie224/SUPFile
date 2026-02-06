const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { AppError } = require('../middlewares/errorHandler');
const { sanitizeSearchInput } = require('../middlewares/security');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { resolvePathInUploadDir } = require('../utils/pathSafety');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// Configuration multer pour l'avatar
const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(config.upload.uploadDir, 'avatars');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Valider que c'est une image
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed', 400));
    }
    
    // Valider le nom de fichier
    if (!file.originalname || file.originalname.length > 255) {
      return cb(new AppError('Invalid filename', 400));
    }
    
    // Vérifier les extensions dangereuses
    const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.js'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (dangerousExts.includes(ext)) {
      return cb(new AppError('File type not allowed for security reasons', 403));
    }
    
    cb(null, true);
  },
}).single('avatar');

// Obtenir les informations de l'utilisateur connecté
async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    // Retirer les informations sensibles (two_factor_enabled pour afficher l'état 2FA dans les paramètres)
    const safeUser = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      quota_used: user.quota_used,
      quota_limit: user.quota_limit,
      preferences: user.preferences,
      is_admin: user.is_admin || false,
      two_factor_enabled: user.two_factor_enabled || false,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    };

    res.status(200).json({ data: safeUser });
  } catch (err) {
    next(err);
  }
}

// Mettre à jour le profil
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { email, display_name } = req.body;

    const updates = {};
    if (email) {
      if (typeof email !== 'string') {
        return res.status(400).json({ error: { message: 'Invalid email format' } });
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail.length < 3 || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: { message: 'Invalid email format' } });
      }
      // Vérifier que l'email n'est pas déjà utilisé
      const existing = await UserModel.findByEmail(normalizedEmail);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: { message: 'Email already in use' } });
      }
      updates.email = normalizedEmail;
    }
    if (display_name !== undefined) {
      if (display_name === null || display_name === '') {
        updates.display_name = null;
      } else {
        if (typeof display_name !== 'string') {
          return res.status(400).json({ error: { message: 'Invalid display_name format' } });
        }
        const trimmed = display_name.trim();
        if (trimmed.length > 100) {
          return res.status(400).json({ error: { message: 'display_name too long' } });
        }
        updates.display_name = trimmed;
      }
    }

    // Mettre à jour dans MongoDB
    const mongoose = require('mongoose');
    const User = mongoose.models.User;
    await User.findByIdAndUpdate(userId, updates);

    const updated = await UserModel.findById(userId);
    const safeUser = {
      id: updated.id,
      email: updated.email,
      display_name: updated.display_name,
      avatar_url: updated.avatar_url,
      quota_used: updated.quota_used,
      quota_limit: updated.quota_limit,
      preferences: updated.preferences,
    };

    res.status(200).json({ data: safeUser, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
}

// Uploader un avatar
async function uploadAvatar(req, res, next) {
  avatarUpload(req, res, async (err) => {
    if (err) {
      return next(err);
    }

    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: { message: 'No file provided' } });
      }

      // Supprimer l'ancien avatar s'il existe
      const user = await UserModel.findById(userId);
      if (user.avatar_url) {
        try {
          const fileName = path.basename(String(user.avatar_url));
          const diskPath = path.join(path.resolve(config.upload.uploadDir), 'avatars', fileName);
          const safePath = resolvePathInUploadDir(diskPath);
          if (safePath) {
            await fs.unlink(safePath);
          }
        } catch (e) {
          // Ignorer si le fichier n'existe pas
        }
      }

      // Mettre à jour l'URL de l'avatar
      const avatarUrl = `/avatars/${req.file.filename}`;
      const mongoose = require('mongoose');
      const User = mongoose.models.User;
      await User.findByIdAndUpdate(userId, { avatar_url: avatarUrl });

      res.status(200).json({
        data: { avatar_url: avatarUrl },
        message: 'Avatar uploaded',
      });
    } catch (err) {
      // Supprimer le fichier en cas d'erreur
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(err);
    }
  });
}

// Changer le mot de passe
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: { message: 'Current password and new password are required' } });
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.password_hash) {
      return res.status(400).json({ error: { message: 'User has no password set (OAuth account)' } });
    }

    // Vérifier le mot de passe actuel
    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: { message: 'Current password is incorrect' } });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // Mettre à jour
    const mongoose = require('mongoose');
    const User = mongoose.models.User;
    await User.findByIdAndUpdate(userId, { password_hash: newPasswordHash });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

// Mettre à jour les préférences
async function updatePreferences(req, res, next) {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
      return res.status(400).json({ error: { message: 'Preferences object is required' } });
    }

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    const updates = {};

    if (hasOwn(preferences, 'theme')) {
      const theme = preferences.theme;
      if (typeof theme !== 'string') {
        return res.status(400).json({ error: { message: 'Invalid theme value' } });
      }
      const normalized = theme.trim().toLowerCase();
      if (!['light', 'dark'].includes(normalized)) {
        return res.status(400).json({ error: { message: 'Invalid theme value' } });
      }
      updates.theme = normalized;
    }

    if (hasOwn(preferences, 'language')) {
      const language = preferences.language;
      if (typeof language !== 'string') {
        return res.status(400).json({ error: { message: 'Invalid language value' } });
      }
      const normalized = language.trim();
      // Format BCP47 simplifié (ex: "en", "fr", "fr-FR")
      if (normalized.length > 10 || !/^[a-z]{2}(-[A-Z]{2})?$/.test(normalized)) {
        return res.status(400).json({ error: { message: 'Invalid language value' } });
      }
      updates.language = normalized;
    }

    if (hasOwn(preferences, 'notifications_enabled')) {
      const value = preferences.notifications_enabled;
      if (typeof value === 'boolean') {
        updates.notifications_enabled = value;
      } else if (value === 'true' || value === 'false') {
        updates.notifications_enabled = value === 'true';
      } else {
        return res.status(400).json({ error: { message: 'Invalid notifications_enabled value' } });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: { message: 'No supported preferences provided' } });
    }

    // Stocker uniquement les clés supportées pour éviter le stockage arbitraire
    // et préserver les valeurs existantes pour les clés non modifiées.
    const currentUser = await UserModel.findById(userId);
    const currentPrefs = (currentUser && currentUser.preferences && typeof currentUser.preferences === 'object' && !Array.isArray(currentUser.preferences))
      ? currentUser.preferences
      : {};
    const nextPreferences = {
      theme: typeof currentPrefs.theme === 'string' ? currentPrefs.theme : 'light',
      language: typeof currentPrefs.language === 'string' ? currentPrefs.language : 'en',
      notifications_enabled: typeof currentPrefs.notifications_enabled === 'boolean' ? currentPrefs.notifications_enabled : true,
      ...updates,
    };

    await UserModel.updatePreferences(userId, nextPreferences);

    const user = await UserModel.findById(userId);
    res.status(200).json({
      data: { preferences: user.preferences },
      message: 'Preferences updated',
    });
  } catch (err) {
    next(err);
  }
}

// Lister les utilisateurs (pour le partage interne)
async function listUsers(req, res, next) {
  try {
    const currentUserId = req.user.id;
    const { search } = req.query;

    const mongoose = require('mongoose');
    const User = mongoose.models.User;
    
    // Some older records may miss is_active; treat them as active unless explicitly false.
    // NOTE: Avoid query operators on boolean here because some Mongoose setups may CastError
    // when casting operator objects for Boolean paths.
    const query = {};

    // Support multi-word search like "john doe" by requiring all tokens to match
    // across any of the allowed fields.
    const rawSearch = (typeof search === 'string') ? search.trim() : '';
    const tokens = rawSearch.split(/\s+/).filter(Boolean).slice(0, 5);
    const safeTokens = tokens.map(t => sanitizeSearchInput(t)).filter(Boolean);

    // IMPORTANT: mongoose.set('sanitizeFilter', true) strips keys starting with '$' inside filters.
    // Using {$regex, $options} would be sanitized into {} and cause CastErrors (e.g., "Cast to string failed").
    // Use RegExp values instead.
    const tokenOr = (t) => {
      const rx = new RegExp(t, 'i');
      return [
        { email: rx },
        { display_name: rx },
        { first_name: rx },
        { last_name: rx },
      ];
    };

    if (safeTokens.length === 1) {
      query.$or = tokenOr(safeTokens[0]);
    } else if (safeTokens.length > 1) {
      query.$and = safeTokens.map(t => ({ $or: tokenOr(t) }));
    }

    const users = await User.find(query)
      .select('email display_name first_name last_name avatar_url is_active')
      .limit(50)
      .lean();

    // Exclure l'utilisateur actuel et formater les résultats
    const safeUsers = users
      .filter(u => u.is_active !== false)
      .filter(u => u._id.toString() !== currentUserId)
      .map(u => ({
        id: u._id.toString(),
        email: u.email,
        display_name: (typeof u.display_name === 'string' && u.display_name.trim() !== '')
          ? u.display_name.trim()
          : [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email,
        avatar_url: u.avatar_url,
      }));

    res.status(200).json({ data: safeUsers });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateProfile,
  uploadAvatar,
  changePassword,
  updatePreferences,
  listUsers,
};

