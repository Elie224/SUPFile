// Design System - Point d'entrée principal
// Exporte tous les tokens de design

import colorsModule from './colors';
import spacing from './spacing';
import shadows from './shadows';
import bordersModule from './borders';

export const colors = colorsModule;
export const theme = colorsModule;
export { default as spacing } from './spacing';
export { default as shadows } from './shadows';
export const { borders, borderRadius } = bordersModule;

// Design tokens complets
export const designTokens = {
  colors: colorsModule,
  theme: colorsModule,
  spacing,
  shadows,
  borderRadius: bordersModule.borderRadius,
  borders: bordersModule.borders,
};

export default designTokens;
