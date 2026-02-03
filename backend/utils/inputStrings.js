function capString(value, maxLen) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function normalizeTokenString(value, maxLen) {
  if (typeof value !== 'string') return null;
  if (!value) return null;
  if (value.length > maxLen) return null;
  return value;
}

module.exports = {
  capString,
  normalizeTokenString,
};
