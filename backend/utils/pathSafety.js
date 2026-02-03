const path = require('path');
const config = require('../config');

function resolvePathInUploadDir(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;

  const baseDir = path.resolve(config.upload.uploadDir);
  const absPath = path.resolve(filePath);

  const baseWithSep = baseDir.endsWith(path.sep) ? baseDir : `${baseDir}${path.sep}`;
  if (absPath === baseDir || absPath.startsWith(baseWithSep)) {
    return absPath;
  }

  return null;
}

module.exports = {
  resolvePathInUploadDir,
};
