const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const ShareSchema = new Schema({
  file_id: { type: Schema.Types.ObjectId, ref: 'File' },
  folder_id: { type: Schema.Types.ObjectId, ref: 'Folder' },
  created_by_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  share_type: { type: String, enum: ['public', 'internal'], required: true },
  public_token: { type: String, unique: true, sparse: true },
  requires_password: { type: Boolean, default: false },
  password_hash: String,
  expires_at: Date,
  shared_with_user_id: { type: Schema.Types.ObjectId, ref: 'User' },
  is_active: { type: Boolean, default: true },
  access_count: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Indexes
ShareSchema.index({ public_token: 1 });
ShareSchema.index({ file_id: 1 });
ShareSchema.index({ folder_id: 1 });
ShareSchema.index({ created_by_id: 1 });
ShareSchema.index({ shared_with_user_id: 1 });
ShareSchema.index({ expires_at: 1 });

const Share = mongoose.models.Share || mongoose.model('Share', ShareSchema);

const ShareModel = {
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  async createPublicShare({ fileId, folderId, createdById, password = null, expiresAt = null }) {
    const token = this.generateToken();
    const share = new Share({
      file_id: fileId,
      folder_id: folderId,
      created_by_id: createdById,
      share_type: 'public',
      public_token: token,
      requires_password: !!password,
      password_hash: password, // Password is already hashed in controller
      expires_at: expiresAt,
    });
    const saved = await share.save();
    return this.toDTO(saved);
  },

  async createInternalShare({ fileId, folderId, createdById, sharedWithUserId }) {
    const share = new Share({
      file_id: fileId,
      folder_id: folderId,
      created_by_id: createdById,
      share_type: 'internal',
      shared_with_user_id: sharedWithUserId,
    });
    const saved = await share.save();
    return this.toDTO(saved);
  },

  async findById(id) {
    const share = await Share.findById(id).lean();
    return share ? this.toDTO(share) : null;
  },

  async findByToken(token) {
    const share = await Share.findOne({ public_token: token, is_active: true }).lean();
    if (!share) return null;

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return null;
    }

    return this.toDTO(share);
  },

  async findByFileOrFolder(fileId, folderId) {
    const query = {};
    if (fileId) query.file_id = fileId;
    if (folderId) query.folder_id = folderId;
    const shares = await Share.find(query).lean();
    return shares.map(s => this.toDTO(s));
  },

  async findBySharedWith(userId) {
    const shares = await Share.find({
      shared_with_user_id: userId,
      is_active: true,
    }).lean();
    return shares.map(s => this.toDTO(s));
  },

  async incrementAccessCount(token) {
    await Share.findOneAndUpdate(
      { public_token: token },
      { $inc: { access_count: 1 } }
    );
  },

  async deactivate(id) {
    const share = await Share.findByIdAndUpdate(id, { is_active: false }, { new: true }).lean();
    return share ? this.toDTO(share) : null;
  },

  async delete(id) {
    await Share.findByIdAndDelete(id);
  },

  toDTO(share) {
    if (!share) return null;
    return {
      id: share._id.toString(),
      file_id: share.file_id?.toString() || share.file_id,
      folder_id: share.folder_id?.toString() || share.folder_id,
      created_by_id: share.created_by_id?.toString() || share.created_by_id,
      share_type: share.share_type,
      public_token: share.public_token,
      requires_password: share.requires_password || false,
      expires_at: share.expires_at,
      shared_with_user_id: share.shared_with_user_id?.toString() || share.shared_with_user_id,
      is_active: share.is_active !== false,
      access_count: share.access_count || 0,
      created_at: share.created_at,
      updated_at: share.updated_at,
    };
  },
};

module.exports = ShareModel;

