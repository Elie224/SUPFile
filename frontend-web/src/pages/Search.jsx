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
    }
  }, [debouncedQuery, filters]);

  // Memoization de la fonction de recherche
  const handleSearch = useCallback(async (searchQuery = query) => {
    // Permettre la recherche même sans query si des filtres sont appliqués
    const hasQuery = searchQuery && searchQuery.trim();
    const hasFilters = filters.date_from || filters.date_to || filters.mime_type || filters.type !== 'all';
    
    if (!hasQuery && !hasFilters) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      // Préparer les paramètres de recherche
      const searchParams = {
        q: hasQuery ? searchQuery.trim() : '',
        type: filters.type === 'files' ? 'file' : filters.type === 'folders' ? 'folder' : filters.type,
        mime_type: filters.mime_type || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
      };
      
      // Supprimer les paramètres undefined
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === undefined || searchParams[key] === '') {
          delete searchParams[key];
        }
      });
      
      const response = await dashboardService.search(searchParams.q || '', searchParams);
      setResults(response.data.data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
      console.error('Error details:', err.response?.data || err.message);
      setResults([]);
      // Afficher un message d'erreur à l'utilisateur
      alert('Erreur lors de la recherche: ' + (err.response?.data?.error?.message || err.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  // Memoization de la fonction formatBytes
  const formatBytes = useCallback((bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Memoization des résultats filtrés
  const filteredResults = useMemo(() => {
    return results;
  }, [results]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '28px', 
        marginBottom: '24px',
        fontWeight: '700',
        color: '#333'
      }}>🔍 {t('search')}</h1>
      
      <div style={{ 
        marginBottom: 24, 
        padding: '24px', 
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              style={{ 
                padding: '14px 18px', 
                flex: 1,
                fontSize: '16px', 
                boxSizing: 'border-box',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2196F3'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              style={{ 
                padding: '14px 24px',
                fontSize: '16px',
                backgroundColor: loading ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? t('loading') || 'Chargement...' : t('search') || 'Rechercher'}
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginTop: '20px'
        }}>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            style={{
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">{t('allTypes') || 'Tous les types'}</option>
            <option value="file">{t('files') || 'Fichiers'}</option>
            <option value="folder">{t('folders') || 'Dossiers'}</option>
          </select>

          <select
            value={filters.mime_type}
            onChange={(e) => handleFilterChange('mime_type', e.target.value)}
            style={{
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="">{t('allFormats') || 'Tous les formats'}</option>
            <option value="image/">{t('images') || 'Images'}</option>
            <option value="video/">{t('videos') || 'Vidéos'}</option>
            <option value="audio/">{t('audio') || 'Audio'}</option>
            <option value="application/pdf">{t('documents') || 'Documents'}</option>
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            placeholder={t('dateFrom') || 'Date début'}
            style={{
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none'
            }}
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            placeholder={t('dateTo') || 'Date fin'}
            style={{
              padding: '12px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Résultats */}
      {loading && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#666'
        }}>
          {t('loading') || 'Chargement...'}
        </div>
      )}

      {!loading && filteredResults.length === 0 && query && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          color: '#666'
        }}>
          {t('noResults') || 'Aucun résultat trouvé'}
        </div>
      )}

      {!loading && filteredResults.length > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  {t('name') || 'Nom'}
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  {t('type') || 'Type'}
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  {t('size') || 'Taille'}
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  {t('modified') || 'Modifié'}
                </th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333' }}>
                  {t('actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((item) => (
                <tr 
                  key={item.id} 
                  style={{ 
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px', color: '#333' }}>
                    {item.item_type === 'folder' || item.type === 'folder' ? '📁 ' : ''}
                    {item.name}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {item.item_type === 'folder' || item.type === 'folder' ? '📁 Dossier' : item.mime_type || '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {item.size ? formatBytes(item.size) : '-'}
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => {
                        if (item.item_type === 'folder' || item.type === 'folder') {
                          navigate(`/files?folder=${item.id}`);
                        } else {
                          // Pour les fichiers, naviguer vers la page de prévisualisation
                          navigate(`/preview/${item.id}`);
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1976D2'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#2196F3'}
                    >
                      {t('view') || 'Voir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
