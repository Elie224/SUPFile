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

    // Rechercher dans les fichiers
    if (!type || type === 'file' || type === 'all') {
      const files = await FileModel.search(userId, q, filters);
      results.push(...files.map(f => ({ ...f, item_type: 'file' })));
    }

    // Rechercher dans les dossiers
    if (!type || type === 'folder' || type === 'all') {
      const folders = await FolderModel.findByOwner(userId, null, false);
      let filteredFolders = folders;

      if (q) {
        filteredFolders = folders.filter(f => 
          f.name.toLowerCase().includes(q.toLowerCase())
        );
      }

      // Filtrer par date si nécessaire
      if (date_from || date_to) {
        filteredFolders = filteredFolders.filter(f => {
          const updatedAt = new Date(f.updated_at);
          if (date_from && updatedAt < new Date(date_from)) return false;
          if (date_to && updatedAt > new Date(date_to)) return false;
          return true;
        });
      }

      // Trier
      filteredFolders.sort((a, b) => {
        const aVal = a[sort_by] || a.name;
        const bVal = b[sort_by] || b.name;
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sort_order === 'asc' ? comparison : -comparison;
      });

      // Pagination
      const paginated = filteredFolders.slice(filters.skip, filters.skip + filters.limit);
      results.push(...paginated.map(f => ({ ...f, item_type: 'folder' })));
    }

    res.status(200).json({
      data: {
        items: results,
        pagination: {
          total: results.length,
          skip: filters.skip,
          limit: filters.limit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  search,
};

