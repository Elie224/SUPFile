const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { AppError } = require('../middlewares/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400));
    }
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

    // Retirer les informations sensibles
    const safeUser = {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      quota_used: user.quota_used,
      quota_limit: user.quota_limit,
      preferences: user.preferences,
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
      // Vérifier que l'email n'est pas déjà utilisé
      const existing = await UserModel.findByEmail(email);
      if (existing && existing.id !== userId) {
        return res.status(409).json({ error: { message: 'Email already in use' } });
      }
      updates.email = email;
    }
    if (display_name !== undefined) {
      updates.display_name = display_name;
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
          await fs.unlink(path.resolve(user.avatar_url));
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

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: { message: 'Preferences object is required' } });
    }

    await UserModel.updatePreferences(userId, preferences);

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
    
    const query = { is_active: true };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { display_name: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('email display_name avatar_url')
      .limit(50)
      .lean();

    // Exclure l'utilisateur actuel et formater les résultats
    const safeUsers = users
      .filter(u => u._id.toString() !== currentUserId)
      .map(u => ({
        id: u._id.toString(),
        email: u.email,
        display_name: u.display_name,
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

