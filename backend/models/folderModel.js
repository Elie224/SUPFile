const mongoose = require('mongoose');
const { Schema } = mongoose;

const FolderSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parent_id: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  is_deleted: { type: Boolean, default: false },
  deleted_at: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes
FolderSchema.index({ owner_id: 1, parent_id: 1 });
FolderSchema.index({ owner_id: 1 });
FolderSchema.index({ parent_id: 1 });
FolderSchema.index({ is_deleted: 1 });

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

  async findByOwner(ownerId, parentId = null, includeDeleted = false) {
    const query = { owner_id: ownerId, parent_id: parentId || null };
    if (!includeDeleted) {
      query.is_deleted = false;
    }
    const folders = await Folder.find(query).sort({ name: 1 }).lean();
    return folders.map(f => this.toDTO(f));
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

