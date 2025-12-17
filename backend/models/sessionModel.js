const mongoose = require('mongoose');
const { Schema } = mongoose;
const parseExpiryToMs = (expiry) => {
  if (!expiry || typeof expiry !== 'string') return 0;
  const match = expiry.match(/^(\d+)\s*([dhms])$/i);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { d: 24 * 3600 * 1000, h: 3600 * 1000, m: 60 * 1000, s: 1000 };
  return value * (multipliers[unit] || 1000);
};

const SessionSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  refresh_token: { type: String, required: true, unique: true },
  user_agent: String,
  ip_address: String,
  device_name: String,
  is_revoked: { type: Boolean, default: false },
  expires_at: { type: Date, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

const SessionModel = {
  async createSession({ userId, refreshToken, userAgent = null, ipAddress = null, deviceName = null, expiresIn = '7d' }) {
    const ms = parseExpiryToMs(expiresIn) || 0;
    const expiresAt = ms ? new Date(Date.now() + ms) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const s = new Session({ user_id: userId, refresh_token: refreshToken, user_agent: userAgent, ip_address: ipAddress, device_name: deviceName, expires_at: expiresAt });
    return s.save();
  },

  async findByToken(token) {
    return Session.findOne({ refresh_token: token }).lean();
  },

  async revokeByToken(token) {
    return Session.findOneAndUpdate({ refresh_token: token }, { is_revoked: true }, { new: true }).lean();
  },

  async rotateToken(oldToken, newToken, expiresIn = '7d') {
    const ms = parseExpiryToMs(expiresIn) || 0;
    const expiresAt = ms ? new Date(Date.now() + ms) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
    return Session.findOneAndUpdate({ refresh_token: oldToken }, { refresh_token: newToken, expires_at: expiresAt, is_revoked: false }, { new: true }).lean();
  },
};

module.exports = SessionModel;
