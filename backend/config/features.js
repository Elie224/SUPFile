// Feature flags pour la flexibilité et le déploiement progressif
// Permet d'activer/désactiver des fonctionnalités sans redéploiement

const features = {
  // Cache
  enableCache: process.env.ENABLE_CACHE !== 'false', // Activé par défaut
  
  // Compression
  enableCompression: process.env.ENABLE_COMPRESSION !== 'false', // Activé par défaut
  
  // Rate limiting
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false', // Activé par défaut
  
  // Recherche avancée
  enableAdvancedSearch: process.env.ENABLE_ADVANCED_SEARCH === 'true', // Désactivé par défaut
  
  // Partage avancé
  enableSharePassword: process.env.ENABLE_SHARE_PASSWORD !== 'false', // Activé par défaut
  enableShareExpiration: process.env.ENABLE_SHARE_EXPIRATION !== 'false', // Activé par défaut
  
  // Prévisualisation
  enableVideoPreview: process.env.ENABLE_VIDEO_PREVIEW !== 'false', // Activé par défaut
  enableAudioPreview: process.env.ENABLE_AUDIO_PREVIEW !== 'false', // Activé par défaut
  
  // Administration
  enableAdminPanel: process.env.ENABLE_ADMIN_PANEL !== 'false', // Activé par défaut
  
  // OAuth
  enableGoogleOAuth: process.env.ENABLE_GOOGLE_OAUTH !== 'false', // Activé par défaut
  enableGitHubOAuth: process.env.ENABLE_GITHUB_OAUTH !== 'false', // Activé par défaut
  
  // Performance
  enableQueryOptimization: process.env.ENABLE_QUERY_OPTIMIZATION !== 'false', // Activé par défaut
  enableIndexHints: process.env.ENABLE_INDEX_HINTS !== 'false', // Activé par défaut
};

/**
 * Vérifier si une feature est activée
 */
function isFeatureEnabled(featureName) {
  return features[featureName] === true;
}

/**
 * Obtenir toutes les features
 */
function getFeatures() {
  return { ...features };
}

module.exports = {
  features,
  isFeatureEnabled,
  getFeatures,
};


