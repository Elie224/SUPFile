import React from 'react';
import { LOGO_IMG } from '../config';

/**
 * Composant Logo réutilisable
 * - Bordures arrondies
 * - S'adapte au thème clair/sombre
 */
export default function Logo({ size = 'medium', style = {}, className = '' }) {
  // Tailles prédéfinies
  const sizes = {
    small: { height: '32px', width: 'auto' },
    medium: { height: '48px', width: 'auto' },
    large: { maxWidth: '120px', height: 'auto' },
  };

  const sizeStyle = sizes[size] || sizes.medium;

  // Style de base avec bordures arrondies et adaptation au thème
  const logoStyle = {
    ...sizeStyle,
    borderRadius: '12px',
    // Fond léger pour le mode sombre (le logo reste visible)
    backgroundColor: 'var(--logo-bg, transparent)',
    padding: '4px',
    transition: 'all 0.3s ease',
    ...style,
  };

  return (
    <img
      src={LOGO_IMG}
      alt="SUPFile"
      className={`app-logo ${className}`}
      style={logoStyle}
    />
  );
}
