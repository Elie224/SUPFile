// Middleware pour le versioning de l'API
// Permet de gérer plusieurs versions de l'API simultanément

function apiVersioning(req, res, next) {
  // Extraire la version de l'URL ou du header
  const versionFromUrl = req.path.match(/^\/api\/v(\d+)\//);
  const versionFromHeader = req.headers['api-version'];
  
  let apiVersion = 'v1'; // Version par défaut
  
  if (versionFromUrl) {
    apiVersion = `v${versionFromUrl[1]}`;
  } else if (versionFromHeader) {
    apiVersion = versionFromHeader;
  }
  
  // Ajouter la version à la requête
  req.apiVersion = apiVersion;
  
  // Si la version est dans l'URL, modifier le path pour retirer la version
  if (versionFromUrl) {
    req.url = req.url.replace(`/api/${apiVersion}`, '/api');
    req.originalUrl = req.originalUrl.replace(`/api/${apiVersion}`, '/api');
  }
  
  next();
}

module.exports = apiVersioning;


