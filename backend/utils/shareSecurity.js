function normalizePublicShareToken(raw) {
  if (typeof raw !== 'string') return null;
  const token = raw.trim();
  // ShareModel.generateToken() creates 32 bytes hex => 64 hex chars
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  return token.toLowerCase();
}

function normalizeSharePasswordForCompare(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') return null;
  // Do not trim: password comparison should preserve exact user input
  if (raw.length < 1) return null;
  if (raw.length > 256) return null;
  return raw;
}

module.exports = {
  normalizePublicShareToken,
  normalizeSharePasswordForCompare,
};
