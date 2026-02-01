const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlockedEmailSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  blocked_by: { type: Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, default: 'Suppression définitive par un administrateur' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

BlockedEmailSchema.index({ email: 1 });

const BlockedEmail = mongoose.models.BlockedEmail || mongoose.model('BlockedEmail', BlockedEmailSchema);

const BlockedEmailModel = {
  async isBlocked(email) {
    if (!email || typeof email !== 'string') return false;
    const doc = await BlockedEmail.findOne({ email: email.toLowerCase().trim() }).lean();
    return !!doc;
  },

  async add(email, blockedById = null) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const existing = await BlockedEmail.findOne({ email: normalized });
    if (existing) return existing;
    const doc = new BlockedEmail({ email: normalized, blocked_by: blockedById });
    return doc.save();
  }
};

module.exports = BlockedEmailModel;
