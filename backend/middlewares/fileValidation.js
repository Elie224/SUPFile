// Validation et sécurité des fichiers uploadés
const path = require('path');
const fs = require('fs').promises;
const { AppError } = require('./errorHandler');

// Types MIME autorisés (peut être étendu selon les besoins)
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Textes
  'text/plain', 'text/html', 'text/css', 'text/javascript',
  'text/markdown', 'text/csv',
  // Archives
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/x-tar', 'application/gzip',
  // Audio
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
  // Vidéo
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg',
  // Autres
  'application/json', 'application/xml', 'application/octet-stream',
];

// Extensions de fichiers dangereuses à bloquer
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.sh', '.ps1', '.app', '.deb', '.rpm', '.dmg', '.msi',
];

/**
 * Vérifier si un type MIME est autorisé
 */
function isAllowedMimeType(mimeType) {
  if (!mimeType) {
    return false;
  }
  
  // En mode développement, accepter tous les types pour faciliter les tests
  // En production, utiliser la liste stricte
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_ALL_FILE_TYPES === 'true') {
    return true;
  }
  
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Vérifier si une extension est dangereuse
 */
function isDangerousExtension(filename) {
  if (!filename) {
    return true;
  }
  
  const ext = path.extname(filename).toLowerCase();
  return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Valider un fichier uploadé
 */
async function validateUploadedFile(file) {
  if (!file) {
    throw new AppError('No file provided', 400);
  }
  
  // Vérifier l'extension dangereuse
  if (isDangerousExtension(file.originalname)) {
    throw new AppError('File type not allowed for security reasons', 403);
  }
  
  // Vérifier le type MIME (optionnel selon la configuration)
  if (process.env.STRICT_MIME_VALIDATION === 'true' && !isAllowedMimeType(file.mimetype)) {
    throw new AppError('File type not allowed', 403);
  }
  
  // Vérifier que le fichier existe physiquement
  try {
    await fs.access(file.path);
  } catch (err) {
    throw new AppError('Uploaded file not accessible', 500);
  }
  
  // Vérifier la taille du fichier (déjà fait par multer, mais double vérification)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || 32212254720); // 30 Go
  if (file.size > maxSize) {
    await fs.unlink(file.path).catch(() => {});
    throw new AppError('File too large', 413);
  }
  
  // Vérifier que le nom du fichier est valide
  if (file.originalname.length > 255) {
    throw new AppError('Filename too long', 400);
  }
  
  return true;
}

/**
 * Middleware pour valider les fichiers uploadés
 */
async function validateFileUpload(req, res, next) {
  try {
    if (req.file) {
      await validateUploadedFile(req.file);
    }
    next();
  } catch (err) {
    // Nettoyer le fichier en cas d'erreur
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
}

module.exports = {
  isAllowedMimeType,
  isDangerousExtension,
  validateUploadedFile,
  validateFileUpload,
  ALLOWED_MIME_TYPES,
  DANGEROUS_EXTENSIONS,
};

