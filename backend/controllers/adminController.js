const UserModel = require('../models/userModel');
const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');
const mongoose = require('mongoose');

// Statistiques générales
async function getStats(req, res, next) {
  try {
    const User = mongoose.models.User || mongoose.model('User');
    const File = mongoose.models.File || mongoose.model('File');
    const Folder = mongoose.models.Folder || mongoose.model('Folder');

    const [
      totalUsers,
      activeUsers,
      totalFiles,
      totalFolders,
      totalStorageUsed,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ is_active: true }),
      File.countDocuments({ deleted_at: null }),
      Folder.countDocuments({ deleted_at: null }),
      User.aggregate([
        { $group: { _id: null, total: { $sum: '$quota_used' } } }
      ]),
      User.find()
        .sort({ created_at: -1 })
        .limit(10)
        .select('email display_name created_at last_login_at is_active')
        .lean()
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      files: {
        total: totalFiles
      },
      folders: {
        total: totalFolders
      },
      storage: {
        total_used: totalStorageUsed[0]?.total || 0
      },
      recent_users: recentUsers.map(u => ({
        id: u._id.toString(),
        email: u.email,
        display_name: u.display_name,
        created_at: u.created_at,
        last_login_at: u.last_login_at,
        is_active: u.is_active
      }))
    };

    res.status(200).json({ data: stats });
  } catch (err) {
    next(err);
  }
}

// Lister tous les utilisateurs
async function getUsers(req, res, next) {
  try {
    const User = mongoose.models.User || mongoose.model('User');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { display_name: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password_hash')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      data: {
        users: users.map(u => ({
          id: u._id.toString(),
          email: u.email,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          quota_limit: u.quota_limit,
          quota_used: u.quota_used,
          is_active: u.is_active,
          is_admin: u.is_admin || false,
          created_at: u.created_at,
          last_login_at: u.last_login_at
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

// Obtenir les détails d'un utilisateur
async function getUser(req, res, next) {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    // Compter les fichiers et dossiers de l'utilisateur
    const File = mongoose.models.File || mongoose.model('File');
    const Folder = mongoose.models.Folder || mongoose.model('Folder');

    const [filesCount, foldersCount] = await Promise.all([
      File.countDocuments({ user_id: userId, deleted_at: null }),
      Folder.countDocuments({ user_id: userId, deleted_at: null })
    ]);

    res.status(200).json({
      data: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        quota_limit: user.quota_limit,
        quota_used: user.quota_used,
        is_active: user.is_active,
        is_admin: user.is_admin || false,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
        files_count: filesCount,
        folders_count: foldersCount
      }
    });
  } catch (err) {
    next(err);
  }
}

// Mettre à jour un utilisateur
async function updateUser(req, res, next) {
  try {
    const userId = req.params.id;
    const { display_name, quota_limit, is_active, is_admin } = req.body;

    const User = mongoose.models.User || mongoose.model('User');
    const updateData = {};

    if (display_name !== undefined) updateData.display_name = display_name;
    if (quota_limit !== undefined) updateData.quota_limit = parseInt(quota_limit);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (is_admin !== undefined) updateData.is_admin = Boolean(is_admin);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password_hash').lean();

    if (!user) {
      return res.status(404).json({
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    res.status(200).json({
      data: {
        id: user._id.toString(),
        email: user.email,
        display_name: user.display_name,
        quota_limit: user.quota_limit,
        is_active: user.is_active,
        is_admin: user.is_admin || false
      }
    });
  } catch (err) {
    next(err);
  }
}

// Supprimer un utilisateur
async function deleteUser(req, res, next) {
  try {
    const userId = req.params.id;

    // Ne pas permettre de supprimer son propre compte
    if (userId === req.user.id) {
      return res.status(400).json({
        error: { message: 'Vous ne pouvez pas supprimer votre propre compte' }
      });
    }

    const User = mongoose.models.User || mongoose.model('User');
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        error: { message: 'Utilisateur non trouvé' }
      });
    }

    res.status(200).json({
      data: { message: 'Utilisateur supprimé avec succès' }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser
};

