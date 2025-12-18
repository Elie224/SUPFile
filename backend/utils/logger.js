// Système de logging structuré pour l'application
// Remplace tous les console.log/error par un système de logging professionnel

const winston = require('winston');
const path = require('path');

// Configuration des niveaux de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Couleurs pour chaque niveau
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format des logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format pour la console (plus lisible)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transports (destinations des logs)
const transports = [
  // Console
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  }),
];

// Ajouter un transport fichier en production si nécessaire
if (process.env.LOG_FILE && process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE, 'error.log'),
      level: 'error',
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(process.env.LOG_FILE, 'combined.log'),
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // Ne pas quitter en cas d'erreur
  exitOnError: false,
});

// Méthodes helper pour faciliter l'utilisation
logger.logRequest = (req, res, responseTime) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message || 'Unknown error', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

logger.logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

logger.logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

logger.logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

module.exports = logger;
