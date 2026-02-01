const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');
const { sanitizeSearchInput, sanitizePaginationSort } = require('../middlewares/security');

/** Whitelist mime_type pour éviter injection / ReDoS (ex: ".*") */
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'text/', 'application/pdf', 'application/json'];
function _sanitizeMimeType(value) {
  if (!value || typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase().slice(0, 80);
  if (ALLOWED_MIME_PREFIXES.some(p => v === p || v.startsWith(p + ';'))) return v;
  if (/^[a-z0-9+-]+\/[a-z0-9+.+-]+$/i.test(v)) return v;
  return undefined;
}

/** Parser une date de façon sûre (éviter Invalid Date / abus) */
function _parseSafeDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  if (d.getFullYear() < 1970 || d.getFullYear() > 2100) return undefined;
  return d.toISOString().slice(0, 10);
}

// Rechercher des fichiers et dossiers
async function search(req, res, next) {
  try {
    const userId = req.user.id;
    const { q, type, mime_type, date_from, date_to } = req.query;
    const { sortBy, sortOrder, skip, limit } = sanitizePaginationSort(req.query);

    // Sanitiser la chaîne de recherche (anti-injection NoSQL / ReDoS)
    const safeQ = sanitizeSearchInput(q);

    const filters = {
      mimeType: _sanitizeMimeType(mime_type),
      dateFrom: date_from ? _parseSafeDate(date_from) : undefined,
      dateTo: date_to ? _parseSafeDate(date_to) : undefined,
      sortBy,
      sortOrder,
      skip,
      limit,
    };

    let results = [];
    let totalFiles = 0;
    let totalFolders = 0;

    // Rechercher dans les fichiers
    if (!type || type === 'file' || type === 'files' || type === 'all') {
      const files = await FileModel.search(userId, safeQ, filters);
      totalFiles = files.length;
      results.push(...files.map(f => ({ ...f, item_type: 'file', type: 'file' })));
    }

    // Rechercher dans les dossiers
    if (!type || type === 'folder' || type === 'folders' || type === 'all') {
      const folders = await FolderModel.search(userId, safeQ, filters);
      totalFolders = folders.length;
      results.push(...folders.map(f => ({ ...f, item_type: 'folder', type: 'folder' })));
    }

    // Trier les résultats combinés
    results.sort((a, b) => {
      const aVal = a[sortBy] || a.name || '';
      const bVal = b[sortBy] || b.name || '';
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal < bVal) {
        comparison = -1;
      } else if (aVal > bVal) {
        comparison = 1;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination finale (après tri)
    const paginatedResults = results.slice(filters.skip, filters.skip + filters.limit);

    res.status(200).json({
      data: {
        items: paginatedResults,
        pagination: {
          total: results.length,
          totalFiles,
          totalFolders,
          skip: filters.skip,
          limit: filters.limit,
          hasMore: (filters.skip + filters.limit) < results.length,
        },
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Search error:', err);
    }
    next(err);
  }
}

module.exports = {
  search,
};

