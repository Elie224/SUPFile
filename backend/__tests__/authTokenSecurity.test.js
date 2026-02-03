const { normalizeHexToken64, normalizeEmailForLookup } = require('../utils/authTokenSecurity');

describe('authTokenSecurity utilities', () => {
  test('normalizeHexToken64 accepts 64-hex tokens', () => {
    const t = 'A'.repeat(64);
    expect(normalizeHexToken64(t)).toBe('a'.repeat(64));
  });

  test('normalizeHexToken64 rejects bad tokens', () => {
    expect(normalizeHexToken64('')).toBe(null);
    expect(normalizeHexToken64('abc')).toBe(null);
    expect(normalizeHexToken64('g'.repeat(64))).toBe(null);
    expect(normalizeHexToken64('a'.repeat(63))).toBe(null);
    expect(normalizeHexToken64('a'.repeat(65))).toBe(null);
    expect(normalizeHexToken64(null)).toBe(null);
  });

  test('normalizeEmailForLookup lowercases, trims, and basic-validates', () => {
    expect(normalizeEmailForLookup('  Test@Example.com ')).toBe('test@example.com');
    expect(normalizeEmailForLookup('no-at-symbol')).toBe(null);
    expect(normalizeEmailForLookup('@example.com')).toBe(null);
    expect(normalizeEmailForLookup('a@')).toBe(null);
  });
});
