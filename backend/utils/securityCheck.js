/**
 * Vérifications de sécurité au démarrage (production uniquement).
 * En production, refuse de continuer si les secrets requis sont absents ou trop courts.
 */
const MIN_SECRET_LENGTH = 32;

function ensureProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const config = require('../config');
  const errors = [];

  const jwtSecret = process.env.JWT_SECRET || config.jwt?.secret;
  if (!jwtSecret || (typeof jwtSecret === 'string' && jwtSecret.length < MIN_SECRET_LENGTH)) {
    errors.push('JWT_SECRET doit être défini et contenir au moins 32 caractères');
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET || config.jwt?.refreshSecret;
  if (!refreshSecret || (typeof refreshSecret === 'string' && refreshSecret.length < MIN_SECRET_LENGTH)) {
    errors.push('JWT_REFRESH_SECRET doit être défini et contenir au moins 32 caractères');
  }

  const sessionSecret = process.env.SESSION_SECRET || config.jwt?.secret;
  if (!sessionSecret || (typeof sessionSecret === 'string' && sessionSecret.length < MIN_SECRET_LENGTH)) {
    errors.push('SESSION_SECRET ou JWT_SECRET doit être défini et contenir au moins 32 caractères (pour les sessions OAuth)');
  }

  if (errors.length > 0) {
    console.error('❌ [Sécurité] En production, les secrets suivants sont requis :');
    errors.forEach((e) => console.error('   -', e));
    console.error('   Définissez-les dans les variables d\'environnement (ex: .env, Render, Fly.io).');
    process.exit(1);
  }
}

module.exports = { ensureProductionSecrets };
