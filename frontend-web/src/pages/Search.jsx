import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dashboardService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useDebounce } from '../utils/debounce';

export default function Search() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    mime_type: '',
    date_from: '',
    date_to: '',
  });

  // Debounce de la requête de recherche (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // Recherche automatique quand la requête debouncée ou les filtres changent
  useEffect(() => {
    if (debouncedQuery.trim() || filters.date_from || filters.date_to || filters.mime_type || filters.type !== 'all') {
      handleSearch(debouncedQuery);
    } else {
      setResults([]);
      setError('');
    }
  }, [debouncedQuery, filters]);

  // Memoization de la fonction de recherche
  const handleSearch = useCallback(async (searchQuery = query) => {
    // Permettre la recherche même sans query si des filtres sont appliqués
    const hasQuery = searchQuery && searchQuery.trim();
    const hasFilters = filters.date_from || filters.date_to || filters.mime_type || filters.type !== 'all';
    
    if (!hasQuery && !hasFilters) {
      setResults([]);
      setError('');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Préparer les paramètres de recherche (sans q qui est passé séparément)
      const searchFilters = {
        type: filters.type === 'files' ? 'file' : filters.type === 'folders' ? 'folder' : filters.type,
        mime_type: filters.mime_type || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      };
      
      // Supprimer les paramètres undefined
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key] === undefined || searchFilters[key] === '') {
          delete searchFilters[key];
        }
      });
      
      // Appel correct : query en premier paramètre, filters en second
      const response = await dashboardService.search(hasQuery ? searchQuery.trim() : '', searchFilters);
      setResults(response.data.data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
      console.error('Error details:', err.response?.data || err.message);
      setResults([]);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Erreur inconnue';
      setError(t('searchError') || `Erreur lors de la recherche: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [query, filters, t]);

  // Memoization de la fonction formatBytes
  const formatBytes = useCallback((bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="container-fluid p-3 p-md-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 className="h2 mb-4 d-flex align-items-center gap-2">
        <i className="bi bi-search text-primary"></i>
        {t('search') || 'Recherche'}
      </h1>
      
      {/* Formulaire de recherche */}
      <div className="card shadow-md mb-4 fade-in">
        <div className="card-body">
          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Champ de recherche */}
          <div className="mb-3">
            <label htmlFor="search-input" className="form-label">
              <i className="bi bi-search me-2"></i>
              {t('searchPlaceholder') || 'Rechercher des fichiers ou dossiers...'}
            </label>
            <div className="input-group">
              <input
                type="text"
                id="search-input"
                className="form-control form-control-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder') || 'Rechercher...'}
                autoComplete="off"
              />
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                style={{ minWidth: '120px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {t('loading') || 'Recherche...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    {t('search') || 'Rechercher'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filter-type" className="form-label">
                <i className="bi bi-funnel me-2"></i>
                {t('type') || 'Type'}
              </label>
              <select
                id="filter-type"
                className="form-select"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">{t('allTypes') || 'Tous les types'}</option>
                <option value="file">{t('files') || 'Fichiers'}</option>
                <option value="folder">{t('folders') || 'Dossiers'}</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filter-format" className="form-label">
                <i className="bi bi-file-earmark me-2"></i>
                {t('format') || 'Format'}
              </label>
              <select
                id="filter-format"
                className="form-select"
                value={filters.mime_type}
                onChange={(e) => handleFilterChange('mime_type', e.target.value)}
              >
                <option value="">{t('allFormats') || 'Tous les formats'}</option>
                <option value="image/">{t('images') || 'Images'}</option>
                <option value="video/">{t('videos') || 'Vidéos'}</option>
                <option value="audio/">{t('audio') || 'Audio'}</option>
                <option value="application/pdf">{t('documents') || 'Documents'}</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filter-date-from" className="form-label">
                <i className="bi bi-calendar-event me-2"></i>
                {t('dateFrom') || 'Date début'}
              </label>
              <input
                type="date"
                id="filter-date-from"
                className="form-control"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filter-date-to" className="form-label">
                <i className="bi bi-calendar-event me-2"></i>
                {t('dateTo') || 'Date fin'}
              </label>
              <input
                type="date"
                id="filter-date-to"
                className="form-control"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      {loading && (
        <div className="text-center p-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">{t('loading') || 'Chargement...'}</span>
          </div>
          <p className="text-muted">{t('loading') || 'Chargement...'}</p>
        </div>
      )}

      {!loading && !error && results.length === 0 && (query || filters.type !== 'all' || filters.mime_type || filters.date_from || filters.date_to) && (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <i className="bi bi-inbox text-muted" style={{ fontSize: '48px' }}></i>
            <h3 className="h5 mt-3 text-muted">{t('noResults') || 'Aucun résultat trouvé'}</h3>
            <p className="text-muted">
              {t('tryDifferentSearch') || 'Essayez avec d\'autres mots-clés ou modifiez les filtres'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && results.length === 0 && !query && filters.type === 'all' && !filters.mime_type && !filters.date_from && !filters.date_to && (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <i className="bi bi-search text-muted" style={{ fontSize: '48px' }}></i>
            <h3 className="h5 mt-3 text-muted">{t('startSearch') || 'Commencez votre recherche'}</h3>
            <p className="text-muted">
              {t('enterSearchTerms') || 'Entrez des mots-clés dans le champ de recherche ci-dessus'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="card shadow-md">
          <div className="card-header" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              {t('results') || 'Résultats'} ({results.length})
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th style={{ padding: '16px' }}>
                      <i className="bi bi-file-earmark me-2"></i>
                      {t('name') || 'Nom'}
                    </th>
                    <th style={{ padding: '16px' }}>
                      <i className="bi bi-tag me-2"></i>
                      {t('type') || 'Type'}
                    </th>
                    <th style={{ padding: '16px' }}>
                      <i className="bi bi-hdd me-2"></i>
                      {t('size') || 'Taille'}
                    </th>
                    <th style={{ padding: '16px' }}>
                      <i className="bi bi-clock me-2"></i>
                      {t('modified') || 'Modifié'}
                    </th>
                    <th style={{ padding: '16px' }}>
                      <i className="bi bi-gear me-2"></i>
                      {t('actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => {
                    const isFolder = item.item_type === 'folder' || item.type === 'folder';
                    return (
                      <tr key={item.id}>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-2">
                            {isFolder ? (
                              <i className="bi bi-folder-fill text-warning" style={{ fontSize: '20px' }}></i>
                            ) : (
                              <i className="bi bi-file-earmark text-primary" style={{ fontSize: '20px' }}></i>
                            )}
                            <span className="fw-medium">{item.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="text-muted">
                            {isFolder ? (
                              <><i className="bi bi-folder me-1"></i> Dossier</>
                            ) : (
                              item.mime_type || '-'
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="text-muted">{item.size ? formatBytes(item.size) : '-'}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="text-muted">
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              if (isFolder) {
                                navigate(`/files?folder=${item.id}`);
                              } else {
                                navigate(`/preview/${item.id}`);
                              }
                            }}
                          >
                            <i className="bi bi-eye me-1"></i>
                            {t('view') || 'Voir'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
