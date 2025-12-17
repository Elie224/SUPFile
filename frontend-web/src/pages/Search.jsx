import React, { useState } from 'react';
import { dashboardService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Search() {
  const navigate = useNavigate();
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    mime_type: '',
    date_from: '',
    date_to: '',
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await dashboardService.search(query, filters);
      setResults(response.data.data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
      alert(t('error') + ': ' + (t('language') === 'en' ? 'Search failed' : 'Erreur lors de la recherche'));
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>{t('search')}</h1>
      
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ padding: 8, width: '100%', fontSize: 16 }}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>{t('type')}</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{ padding: 8, width: '100%' }}
            >
              <option value="all">{t('all')}</option>
              <option value="file">{t('file')}</option>
              <option value="folder">{t('folder')}</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>{t('mimeType')}</label>
            <select
              value={filters.mime_type}
              onChange={(e) => setFilters({ ...filters, mime_type: e.target.value })}
              style={{ padding: 8, width: '100%' }}
            >
              <option value="">{t('all')}</option>
              <option value="image/">{t('images')}</option>
              <option value="video/">{t('videos')}</option>
              <option value="audio/">{t('audio')}</option>
              <option value="application/pdf">PDF</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>{t('startDate')}</label>
            <input
              type="date"
              lang={language === 'en' ? 'en-US' : 'fr-FR'}
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              style={{ padding: 8, width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>{t('endDate')}</label>
            <input
              type="date"
              lang={language === 'en' ? 'en-US' : 'fr-FR'}
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              style={{ padding: 8, width: '100%' }}
            />
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          {t('searchButton')}
        </button>
      </div>

      {loading && <div>{t('searching')}</div>}
      
      {results.length > 0 && (
        <div>
          <h2>{t('results')} ({results.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('name')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('type')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('size')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('modified')}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => {
                  if (item.item_type === 'file') {
                    navigate(`/preview/${item.id}`);
                  } else {
                    navigate(`/files?folder=${item.id}`);
                  }
                }}>
                  <td style={{ padding: 12 }}>
                    {item.item_type === 'folder' ? '📁' : '📄'} {item.name}
                  </td>
                  <td style={{ padding: 12 }}>{item.item_type === 'folder' ? t('folder') : item.mime_type || t('file')}</td>
                  <td style={{ padding: 12 }}>{formatBytes(item.size)}</td>
                  <td style={{ padding: 12 }}>{new Date(item.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!loading && results.length === 0 && query && (
        <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>
          {t('noResults')}
        </div>
      )}
    </div>
  );
}



