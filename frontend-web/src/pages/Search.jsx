import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { dashboardService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useDebounce } from '../utils/debounce';
import offlineDB from '../services/offlineDB';

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
  const [fromCache, setFromCache] = useState(false);

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
    setFromCache(false);

    if (typeof navigator !== 'undefined' && !navigator.onLine && hasQuery) {
      try {
        await offlineDB.init();
        const allFiles = await offlineDB.getAllFiles();
        const allFolders = await offlineDB.getAllFolders();
        const q = searchQuery.trim().toLowerCase();
        const fileItems = allFiles.filter(f => (f.name || '').toLowerCase().includes(q)).map(f => ({ ...f, type: 'file' }));
        const folderItems = allFolders.filter(f => (f.name || '').toLowerCase().includes(q)).map(f => ({ ...f, type: 'folder' }));
        let items = [];
        if (filters.type === 'files') items = fileItems;
        else if (filters.type === 'folders') items = folderItems;
        else items = [...folderItems, ...fileItems];
        setResults(items);
        setFromCache(true);
      } catch (e) {
        console.warn('[Search] Cache hors ligne:', e);
        setError(t('searchError') || 'Hors ligne. La recherche utilise le cache local.');
      }
      setLoading(false);
      return;
    }

    try {
      const searchFilters = {
        type: filters.type === 'files' ? 'file' : filters.type === 'folders' ? 'folder' : filters.type,
        mime_type: filters.mime_type || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      };
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key] === undefined || searchFilters[key] === '') delete searchFilters[key];
      });
      const response = await dashboardService.search(hasQuery ? searchQuery.trim() : '', searchFilters);
      setResults(response.data.data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
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

  // Raccourcis de date (ex: "Modifié la semaine dernière")
  const setDatePreset = useCallback((preset) => {
    const now = new Date();
    let dateFrom = '';
    let dateTo = now.toISOString().slice(0, 10);
    switch (preset) {
      case 'today':
        dateFrom = dateTo;
        break;
      case 'this_week': {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
        dateFrom = d.toISOString().slice(0, 10);
        break;
      }
      case 'last_week': {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay() - 6);
        dateFrom = d.toISOString().slice(0, 10);
        const end = new Date(d);
        end.setDate(end.getDate() + 6);
        dateTo = end.toISOString().slice(0, 10);
        break;
      }
      case 'this_month':
        dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      case 'last_month': {
        const m = now.getMonth();
        const y = m === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const lastMonth = m === 0 ? 11 : m - 1;
        dateFrom = `${y}-${String(lastMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(y, lastMonth + 1, 0);
        dateTo = lastDay.toISOString().slice(0, 10);
        break;
      }
      default:
        return;
    }
    setFilters(prev => ({ ...prev, date_from: dateFrom, date_to: dateTo }));
  }, []);

  return (
    <div className="container-fluid p-2 p-sm-3 p-md-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {fromCache && (
        <div className="alert alert-warning mb-3 d-flex align-items-center gap-2" role="alert" style={{ fontSize: '14px' }}>
          <i className="bi bi-cloud-download"></i>
          <span className="small">Recherche effectuée dans le cache local (mode hors ligne).</span>
        </div>
      )}
      <h1 className="h2 mb-3 mb-md-4 d-flex align-items-center gap-2" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)' }}>
        <i className="bi bi-search text-primary"></i>
        {t('search') || 'Recherche'}
      </h1>
      
      {/* Formulaire de recherche */}
      <div className="card shadow-sm mb-4 fade-in">
        <div className="card-body p-3 p-md-4">
          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 py-2" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span className="small">{error}</span>
            </div>
          )}

          {/* Champ de recherche - responsive : input et bouton empilés sur mobile */}
          <div className="mb-3">
            <label htmlFor="search-input" className="form-label small text-muted">
              <i className="bi bi-search me-2"></i>
              {t('searchPlaceholder') || 'Rechercher des fichiers ou dossiers...'}
            </label>
            <div className="d-flex flex-column flex-sm-row gap-2">
              <input
                type="text"
                id="search-input"
                className="form-control form-control-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder') || 'Rechercher...'}
                autoComplete="off"
                style={{ minHeight: '44px' }}
              />
              <button
                className="btn btn-primary flex-sm-shrink-0"
                type="button"
                onClick={() => handleSearch()}
                disabled={loading}
                style={{ minHeight: '44px', minWidth: '120px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span className="d-none d-sm-inline">{t('loading') || 'Recherche...'}</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    <span className="d-none d-sm-inline">{t('search') || 'Rechercher'}</span>
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
          {/* Raccourcis date : Modifié la semaine dernière, etc. */}
          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <span className="small text-muted me-2">{t('modifiedPresets') || 'Modifié :'}</span>
            {[
              { key: 'today', label: t('modifiedToday') || 'Aujourd\'hui' },
              { key: 'this_week', label: t('modifiedThisWeek') || 'Cette semaine' },
              { key: 'last_week', label: t('modifiedLastWeek') || 'La semaine dernière' },
              { key: 'this_month', label: t('modifiedThisMonth') || 'Ce mois' },
              { key: 'last_month', label: t('modifiedLastMonth') || 'Le mois dernier' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className="btn btn-outline-secondary btn-sm me-2 mb-2"
                onClick={() => setDatePreset(key)}
              >
                {label}
              </button>
            ))}
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
        <div className="card shadow-sm">
          <div className="card-header py-2 py-md-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <h5 className="mb-0 small text-md-normal">
              <i className="bi bi-list-ul me-2"></i>
              {t('results') || 'Résultats'} ({results.length})
            </h5>
          </div>
          <div className="card-body p-0">
            {/* Vue mobile : cartes empilées */}
            <div className="d-md-none list-group list-group-flush">
              {results.map((item) => {
                const isFolder = item.item_type === 'folder' || item.type === 'folder';
                return (
                  <div
                    key={item.id}
                    className="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-2 py-3 px-3"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <div className="d-flex align-items-center gap-2 min-width-0 flex-grow-1">
                      {isFolder ? (
                        <i className="bi bi-folder-fill text-warning flex-shrink-0" style={{ fontSize: '1.5rem' }}></i>
                      ) : (
                        <i className="bi bi-file-earmark text-primary flex-shrink-0" style={{ fontSize: '1.5rem' }}></i>
                      )}
                      <div className="min-width-0">
                        <span className="fw-medium text-truncate d-block">{item.name}</span>
                        <span className="text-muted small">
                          {isFolder ? 'Dossier' : (item.mime_type || '-')}
                          {item.size ? ` · ${formatBytes(item.size)}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm flex-shrink-0"
                      onClick={() => {
                        if (isFolder) navigate(`/files?folder=${item.id}`);
                        else navigate(`/preview/${item.id}`);
                      }}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                  </div>
                );
              })}
            </div>
            {/* Vue desktop : tableau */}
            <div className="d-none d-md-block table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>
                      <i className="bi bi-file-earmark me-2"></i>
                      {t('name') || 'Nom'}
                    </th>
                    <th style={{ padding: '12px 16px' }}>
                      <i className="bi bi-tag me-2"></i>
                      {t('type') || 'Type'}
                    </th>
                    <th style={{ padding: '12px 16px' }}>
                      <i className="bi bi-hdd me-2"></i>
                      {t('size') || 'Taille'}
                    </th>
                    <th style={{ padding: '12px 16px' }}>
                      <i className="bi bi-clock me-2"></i>
                      {t('modified') || 'Modifié'}
                    </th>
                    <th style={{ padding: '12px 16px' }}>
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
                        <td style={{ padding: '12px 16px' }}>
                          <div className="d-flex align-items-center gap-2">
                            {isFolder ? (
                              <i className="bi bi-folder-fill text-warning" style={{ fontSize: '20px' }}></i>
                            ) : (
                              <i className="bi bi-file-earmark text-primary" style={{ fontSize: '20px' }}></i>
                            )}
                            <span className="fw-medium">{item.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="text-muted small">
                            {isFolder ? (<>Dossier</>) : (item.mime_type || '-')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="text-muted small">{item.size ? formatBytes(item.size) : '-'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="text-muted small">
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              if (isFolder) navigate(`/files?folder=${item.id}`);
                              else navigate(`/preview/${item.id}`);
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
