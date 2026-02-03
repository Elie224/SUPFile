function normalizeHexToken64(raw) {
  if (typeof raw !== 'string') return null;
  const token = raw.trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  return token.toLowerCase();
}

function normalizeEmailForLookup(raw) {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  // Basic format check (avoid heavy regex). Final check handled by account creation/login schemas.
  if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) return null;
  return email;
}

module.exports = {
  normalizeHexToken64,
  normalizeEmailForLookup,
};
