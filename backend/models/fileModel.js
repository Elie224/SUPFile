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

// Indexes
FileSchema.index({ folder_id: 1 });
FileSchema.index({ owner_id: 1 });
FileSchema.index({ file_path: 1 });
FileSchema.index({ is_deleted: 1 });
FileSchema.index({ owner_id: 1, folder_id: 1, is_deleted: 1 });

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

  async findByOwner(ownerId, folderId = null, includeDeleted = false) {
    const query = { owner_id: ownerId };
    if (folderId !== null) {
      query.folder_id = folderId;
    }
    if (!includeDeleted) {
      query.is_deleted = false;
    }
    const files = await File.find(query).sort({ name: 1 }).lean();
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
    
    if (query) {
      matchQuery.name = { $regex: query, $options: 'i' };
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
        matchQuery.updated_at.$lte = new Date(filters.dateTo);
      }
    }

    const files = await File.find(matchQuery)
      .sort({ [filters.sortBy || 'updated_at']: filters.sortOrder === 'asc' ? 1 : -1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0)
      .lean();

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

