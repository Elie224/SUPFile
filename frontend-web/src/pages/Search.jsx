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
    <div style={{ padding: '16px', maxWidth: '100%', overflowX: 'hidden' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{t('search')}</h1>
      
      <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ padding: '12px', width: '100%', fontSize: 16, boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr',
          gap: 16, 
          marginBottom: 16 
        }}
        className="search-filters"
        >
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>{t('type')}</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              style={{ padding: '12px', width: '100%', fontSize: 16, boxSizing: 'border-box' }}
            >
              <option value="all">{t('all')}</option>
              <option value="file">{t('file')}</option>
              <option value="folder">{t('folder')}</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>{t('mimeType')}</label>
            <select
              value={filters.mime_type}
              onChange={(e) => setFilters({ ...filters, mime_type: e.target.value })}
              style={{ padding: '12px', width: '100%', fontSize: 16, boxSizing: 'border-box' }}
            >
              <option value="">{t('all')}</option>
              <option value="image/">{t('images')}</option>
              <option value="video/">{t('videos')}</option>
              <option value="audio/">{t('audio')}</option>
              <option value="application/pdf">PDF</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>{t('startDate')}</label>
            <input
              type="date"
              lang={language === 'en' ? 'en-US' : 'fr-FR'}
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              style={{ padding: '12px', width: '100%', fontSize: 16, boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: '500' }}>{t('endDate')}</label>
            <input
              type="date"
              lang={language === 'en' ? 'en-US' : 'fr-FR'}
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              style={{ padding: '12px', width: '100%', fontSize: 16, boxSizing: 'border-box' }}
            />
          </div>
        </div>
        
        <button
          onClick={handleSearch}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: 4, 
            cursor: 'pointer',
            fontSize: 16,
            width: '100%',
            minHeight: '44px'
          }}
        >
          {t('searchButton')}
        </button>
      </div>

      {loading && <div>{t('searching')}</div>}
      
      {results.length > 0 && (
        <div>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: '600', color: '#333' }}>{t('results')} ({results.length})</h2>
          <div style={{ 
            overflowX: 'auto', 
            WebkitOverflowScrolling: 'touch',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'separate',
              borderSpacing: 0,
              minWidth: '600px'
            }}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e0e0e0'
                }}>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>{t('name')}</th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>{t('type')}</th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>{t('size')}</th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>{t('modified')}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: index < results.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => {
                      if (item.item_type === 'file') {
                        navigate(`/preview/${item.id}`);
                      } else {
                        navigate(`/files?folder=${item.id}`);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f7ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
                    }}
                  >
                    <td style={{ 
                      padding: '16px', 
                      fontSize: '15px',
                      wordBreak: 'break-word',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: item.item_type === 'folder' ? '20px' : '18px' }}>
                        {item.item_type === 'folder' ? '📁' : '📄'}
                      </span>
                      <span style={{ fontWeight: item.item_type === 'folder' ? '600' : '400', color: item.item_type === 'folder' ? '#2196F3' : '#333' }}>
                        {item.name}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{item.item_type === 'folder' ? t('folder') : item.mime_type || t('file')}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{formatBytes(item.size)}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{new Date(item.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {!loading && results.length === 0 && query && (
        <div style={{ textAlign: 'center', color: '#999', padding: '24px 16px' }}>
          {t('noResults')}
        </div>
      )}
      <style>{`
        @media (min-width: 768px) {
          .search-filters {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}



