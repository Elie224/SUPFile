const mongoose = require('mongoose');
const { Schema } = mongoose;

const FolderSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parent_id: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  is_deleted: { type: Boolean, default: false },
  deleted_at: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes optimisés pour les performances
FolderSchema.index({ owner_id: 1, parent_id: 1 });
FolderSchema.index({ owner_id: 1 });
FolderSchema.index({ parent_id: 1 });
FolderSchema.index({ is_deleted: 1 });
FolderSchema.index({ owner_id: 1, parent_id: 1, is_deleted: 1 }); // Index composé optimisé
FolderSchema.index({ owner_id: 1, is_deleted: 1, updated_at: -1 }); // Pour les dossiers récents
FolderSchema.index({ name: 'text' }); // Index texte pour la recherche
FolderSchema.index({ updated_at: -1 }); // Pour le tri par date

const Folder = mongoose.models.Folder || mongoose.model('Folder', FolderSchema);

const FolderModel = {
  async create({ name, ownerId, parentId = null }) {
    // Convertir ownerId en ObjectId si c'est une string
    const mongoose = require('mongoose');
    const ownerObjectId = typeof ownerId === 'string' ? new mongoose.Types.ObjectId(ownerId) : ownerId;
    const parentObjectId = parentId && typeof parentId === 'string' ? new mongoose.Types.ObjectId(parentId) : parentId;
    
    const folder = new Folder({ name, owner_id: ownerObjectId, parent_id: parentObjectId });
    const saved = await folder.save();
    return this.toDTO(saved);
  },

  async findById(id) {
    const folder = await Folder.findById(id).lean();
    return folder ? this.toDTO(folder) : null;
  },

  async findByOwner(ownerId, parentId = null, includeDeleted = false, options = {}) {
    try {
      // Convertir ownerId en ObjectId si nécessaire
      const ownerObjectId = typeof ownerId === 'string' ? new mongoose.Types.ObjectId(ownerId) : ownerId;
      const parentObjectId = parentId && typeof parentId === 'string' ? new mongoose.Types.ObjectId(parentId) : (parentId || null);
      
      const query = { owner_id: ownerObjectId, parent_id: parentObjectId };
      if (!includeDeleted) {
        query.is_deleted = false;
      }
      
      // Pagination côté base de données pour meilleures performances
      const skip = options.skip || 0;
      const limit = options.limit || 50;
      const sortBy = options.sortBy || 'name';
      const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
      
      const sortObj = {};
      sortObj[sortBy] = sortOrder;
      
      const queryBuilder = Folder.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // Essayer d'utiliser le hint seulement si l'index existe
      try {
        queryBuilder.hint({ owner_id: 1, parent_id: 1, is_deleted: 1 });
      } catch (hintError) {
        // Si le hint échoue, continuer sans hint
        console.warn('Hint failed for folders, continuing without hint:', hintError.message);
      }
      
      const folders = await queryBuilder;
      return folders.map(f => this.toDTO(f));
    } catch (err) {
      console.error('Error in findByOwner (folders):', err);
      throw err;
    }
  },

  async countByOwner(ownerId, parentId = null, includeDeleted = false) {
    try {
      // Convertir ownerId en ObjectId si nécessaire
      const ownerObjectId = typeof ownerId === 'string' ? new mongoose.Types.ObjectId(ownerId) : ownerId;
      const parentObjectId = parentId && typeof parentId === 'string' ? new mongoose.Types.ObjectId(parentId) : (parentId || null);
      
      const query = { owner_id: ownerObjectId, parent_id: parentObjectId };
      if (!includeDeleted) {
        query.is_deleted = false;
      }
      return await Folder.countDocuments(query);
    } catch (err) {
      console.error('Error in countByOwner (folders):', err);
      throw err;
    }
  },

  async findRootFolder(ownerId) {
    const folder = await Folder.findOne({ owner_id: ownerId, parent_id: null, is_deleted: false }).lean();
    return folder ? this.toDTO(folder) : null;
  },

  async update(id, updates) {
    const folder = await Folder.findByIdAndUpdate(id, { ...updates, updated_at: new Date() }, { new: true }).lean();
    return folder ? this.toDTO(folder) : null;
  },

  async softDelete(id) {
    const folder = await Folder.findByIdAndUpdate(
      id,
      { is_deleted: true, deleted_at: new Date() },
      { new: true }
    ).lean();
    return folder ? this.toDTO(folder) : null;
  },

  async restore(id) {
    const folder = await Folder.findByIdAndUpdate(
      id,
      { is_deleted: false, deleted_at: null },
      { new: true }
    ).lean();
    return folder ? this.toDTO(folder) : null;
  },

  async delete(id) {
    await Folder.findByIdAndDelete(id);
  },

  async checkOwnership(id, ownerId) {
    const folder = await Folder.findOne({ _id: id, owner_id: ownerId }).lean();
    return !!folder;
  },

  async search(ownerId, query, filters = {}) {
    const matchQuery = { owner_id: new mongoose.Types.ObjectId(ownerId), is_deleted: false };
    
    // Recherche par nom de dossier
    if (query && query.trim()) {
      // Échapper les caractères spéciaux regex
      const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchQuery.name = { $regex: escapedQuery, $options: 'i' };
    }

    // Filtrer par date si nécessaire
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

    const folders = await Folder.find(matchQuery)
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(skip)
      .lean();

    return folders.map(f => this.toDTO(f));
  },

  toDTO(folder) {
    if (!folder) return null;
    return {
      id: folder._id.toString(),
      name: folder.name,
      owner_id: folder.owner_id?.toString() || folder.owner_id,
      parent_id: folder.parent_id?.toString() || folder.parent_id || null,
      is_deleted: folder.is_deleted || false,
      deleted_at: folder.deleted_at,
      created_at: folder.created_at,
      updated_at: folder.updated_at,
    };
  },
};

module.exports = FolderModel;

