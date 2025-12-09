// Logging utility
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = {
  info: (message, data = '') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message} ${data}\n`;
    console.log(logMessage);
    // fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
  },

  warn: (message, data = '') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WARN] ${message} ${data}\n`;
    console.warn(logMessage);
    // fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
  },

  error: (message, err) => {
    const timestamp = new Date().toISOString();
    const stack = err && err.stack ? err.stack : '';
    const logMessage = `[${timestamp}] [ERROR] ${message} ${stack}\n`;
    console.error(logMessage);
    // fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
  },
};

module.exports = logger;
