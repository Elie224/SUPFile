// Design System - Point d'entrée principal
// Exporte tous les tokens de design

export { default as colors, theme } from './colors';
export { default as spacing } from './spacing';
export { default as shadows } from './shadows';
export { default as borders, borderRadius } from './borders';

// Design tokens complets
export const designTokens = {
  colors,
  theme,
  spacing,
  shadows,
  borderRadius,
  borders,
};

export default designTokens;
