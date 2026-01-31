import React from 'react';
import { LOGO_IMG } from '../config';

/**
 * Composant Logo réutilisable
 * - Bordures arrondies (style moderne)
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
    borderRadius: '50%', // Bordures complètement arrondies (cercle)
    objectFit: 'cover',
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
