const FileModel = require('../models/fileModel');
const FolderModel = require('../models/folderModel');

// Rechercher des fichiers et dossiers
async function search(req, res, next) {
  try {
    const userId = req.user.id;
    const { q, type, mime_type, date_from, date_to, sort_by = 'updated_at', sort_order = 'desc', skip = 0, limit = 50 } = req.query;

    const filters = {
      mimeType: mime_type,
      dateFrom: date_from,
      dateTo: date_to,
      sortBy: sort_by,
      sortOrder: sort_order,
      skip: parseInt(skip),
      limit: parseInt(limit),
    };

    let results = [];
    let totalFiles = 0;
    let totalFolders = 0;

    // Rechercher dans les fichiers
    if (!type || type === 'file' || type === 'files' || type === 'all') {
      const files = await FileModel.search(userId, q, filters);
      totalFiles = files.length;
      results.push(...files.map(f => ({ ...f, item_type: 'file', type: 'file' })));
    }

    // Rechercher dans les dossiers (utiliser la nouvelle méthode search)
    if (!type || type === 'folder' || type === 'folders' || type === 'all') {
      const folders = await FolderModel.search(userId, q, filters);
      totalFolders = folders.length;
      results.push(...folders.map(f => ({ ...f, item_type: 'folder', type: 'folder' })));
    }

    // Trier les résultats combinés
    results.sort((a, b) => {
      const aVal = a[sort_by] || a.name || '';
      const bVal = b[sort_by] || b.name || '';
      
      // Comparaison selon le type de valeur
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal < bVal) {
        comparison = -1;
      } else if (aVal > bVal) {
        comparison = 1;
      }
      
      return sort_order === 'asc' ? comparison : -comparison;
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
    console.error('Search error:', err);
    next(err);
  }
}

module.exports = {
  search,
};

