const { normalizePublicShareToken, normalizeSharePasswordForCompare } = require('../utils/shareSecurity');

describe('shareSecurity utilities', () => {
  test('normalizePublicShareToken accepts 64-hex tokens', () => {
    const t = 'A'.repeat(64);
    expect(normalizePublicShareToken(t)).toBe('a'.repeat(64));
  });

  test('normalizePublicShareToken rejects non-hex or wrong length', () => {
    expect(normalizePublicShareToken('')).toBe(null);
    expect(normalizePublicShareToken('abc')).toBe(null);
    expect(normalizePublicShareToken('g'.repeat(64))).toBe(null);
    expect(normalizePublicShareToken('a'.repeat(63))).toBe(null);
    expect(normalizePublicShareToken('a'.repeat(65))).toBe(null);
    expect(normalizePublicShareToken(null)).toBe(null);
    expect(normalizePublicShareToken({})).toBe(null);
  });

  test('normalizeSharePasswordForCompare enforces type and length without trimming', () => {
    expect(normalizeSharePasswordForCompare(undefined)).toBe(null);
    expect(normalizeSharePasswordForCompare(null)).toBe(null);
    expect(normalizeSharePasswordForCompare('')).toBe(null);
    expect(normalizeSharePasswordForCompare('ok')).toBe('ok');

    const long = 'x'.repeat(257);
    expect(normalizeSharePasswordForCompare(long)).toBe(null);

    // preserves whitespace
    expect(normalizeSharePasswordForCompare('  secret  ')).toBe('  secret  ');
  });
});
