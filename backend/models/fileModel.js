const mongoose = require('mongoose');
const { Schema } = mongoose;

const FileSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  mime_type: { type: String, maxlength: 100 },
  size: { type: Number, required: true },
  folder_id: { type: Schema.Types.ObjectId, ref: 'Folder', required: true },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  file_path: { type: String, required: true, unique: true },
  is_deleted: { type: Boolean, default: false },
  deleted_at: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes optimisés pour les performances
FileSchema.index({ folder_id: 1 });
FileSchema.index({ owner_id: 1 });
FileSchema.index({ file_path: 1 });
FileSchema.index({ is_deleted: 1 });
FileSchema.index({ owner_id: 1, folder_id: 1, is_deleted: 1 }); // Index composé pour les requêtes fréquentes
FileSchema.index({ owner_id: 1, is_deleted: 1, updated_at: -1 }); // Pour les fichiers récents
FileSchema.index({ owner_id: 1, mime_type: 1, is_deleted: 1 }); // Pour les recherches par type
FileSchema.index({ name: 'text', mime_type: 'text' }); // Index texte pour la recherche
FileSchema.index({ updated_at: -1 }); // Pour le tri par date

const File = mongoose.models.File || mongoose.model('File', FileSchema);

const FileModel = {
  async create({ name, mimeType, size, folderId, ownerId, filePath }) {
    const file = new File({
      name,
      mime_type: mimeType,
      size,
      folder_id: folderId,
      owner_id: ownerId,
      file_path: filePath,
    });
    const saved = await file.save();
    return this.toDTO(saved);
  },

  async findById(id) {
    const file = await File.findById(id).lean();
    return file ? this.toDTO(file) : null;
  },

  async findByFolder(folderId, includeDeleted = false) {
    const query = { folder_id: folderId };
    if (!includeDeleted) {
      query.is_deleted = false;
    }
    const files = await File.find(query).sort({ name: 1 }).lean();
    return files.map(f => this.toDTO(f));
  },

  async findByOwner(ownerId, folderId = null, includeDeleted = false, options = {}) {
    const query = { owner_id: ownerId };
    if (folderId !== null) {
      query.folder_id = folderId;
    }
    if (!includeDeleted) {
      query.is_deleted = false;
    }
    
    // Pagination côté base de données pour meilleures performances
    const skip = options.skip || 0;
    const limit = options.limit || 50;
    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
    
    // Utiliser l'index composé si disponible
    const sortObj = {};
    if (sortBy === 'name') {
      sortObj.name = sortOrder;
    } else if (sortBy === 'updated_at') {
      sortObj.updated_at = sortOrder;
    } else {
      sortObj[sortBy] = sortOrder;
    }
    
    const files = await File.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean()
      .hint({ owner_id: 1, folder_id: 1, is_deleted: 1 }); // Utiliser l'index composé
    
    return files.map(f => this.toDTO(f));
  },

  async findByPath(filePath) {
    const file = await File.findOne({ file_path: filePath }).lean();
    return file ? this.toDTO(file) : null;
  },

  async update(id, updates) {
    const file = await File.findByIdAndUpdate(id, { ...updates, updated_at: new Date() }, { new: true }).lean();
    return file ? this.toDTO(file) : null;
  },

  async softDelete(id) {
    const file = await File.findByIdAndUpdate(
      id,
      { is_deleted: true, deleted_at: new Date() },
      { new: true }
    ).lean();
    return file ? this.toDTO(file) : null;
  },

  async restore(id) {
    const file = await File.findByIdAndUpdate(
      id,
      { is_deleted: false, deleted_at: null },
      { new: true }
    ).lean();
    return file ? this.toDTO(file) : null;
  },

  async delete(id) {
    await File.findByIdAndDelete(id);
  },

  async checkOwnership(id, ownerId) {
    const file = await File.findOne({ _id: id, owner_id: ownerId }).lean();
    return !!file;
  },

  async getTotalSizeByOwner(ownerId) {
    try {
      const ownerObjectId = typeof ownerId === 'string' ? new mongoose.Types.ObjectId(ownerId) : ownerId;
      const result = await File.aggregate([
        { $match: { owner_id: ownerObjectId, is_deleted: false } },
        { $group: { _id: null, total: { $sum: '$size' } } },
      ]);
      return result.length > 0 ? result[0].total : 0;
    } catch (err) {
      console.error('Error calculating total size:', err);
      return 0;
    }
  },

  async search(ownerId, query, filters = {}) {
    const matchQuery = { owner_id: new mongoose.Types.ObjectId(ownerId), is_deleted: false };
    
    // Recherche par nom de fichier (toujours utiliser regex pour compatibilité)
    if (query && query.trim()) {
      // Échapper les caractères spéciaux regex
      const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchQuery.name = { $regex: escapedQuery, $options: 'i' };
    }

    if (filters.mimeType) {
      if (filters.mimeType.startsWith('image/')) {
        matchQuery.mime_type = { $regex: '^image/' };
      } else if (filters.mimeType.startsWith('video/')) {
        matchQuery.mime_type = { $regex: '^video/' };
      } else if (filters.mimeType.startsWith('audio/')) {
        matchQuery.mime_type = { $regex: '^audio/' };
      } else {
        matchQuery.mime_type = filters.mimeType;
      }
    }

    if (filters.dateFrom || filters.dateTo) {
      matchQuery.updated_at = {};
      if (filters.dateFrom) {
        matchQuery.updated_at.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        // Ajouter 23h59m59s pour inclure toute la journée
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        matchQuery.updated_at.$lte = endDate;
      }
    }

    const sortBy = filters.sortBy || 'updated_at';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const limit = filters.limit || 50;
    const skip = filters.skip || 0;

    // Utiliser l'index approprié selon le tri
    let hint = null;
    if (sortBy === 'updated_at') {
      hint = { owner_id: 1, is_deleted: 1, updated_at: -1 };
    } else if (filters.mimeType) {
      hint = { owner_id: 1, mime_type: 1, is_deleted: 1 };
    }

    const queryBuilder = File.find(matchQuery)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(skip)
      .lean();
    
    if (hint) {
      queryBuilder.hint(hint);
    }

    const files = await queryBuilder;
    return files.map(f => this.toDTO(f));
  },

  toDTO(file) {
    if (!file) return null;
    return {
      id: file._id.toString(),
      name: file.name,
      mime_type: file.mime_type,
      size: file.size,
      folder_id: file.folder_id?.toString() || file.folder_id,
      owner_id: file.owner_id?.toString() || file.owner_id,
      file_path: file.file_path,
      is_deleted: file.is_deleted || false,
      deleted_at: file.deleted_at,
      created_at: file.created_at,
      updated_at: file.updated_at,
    };
  },
};

module.exports = FileModel;

