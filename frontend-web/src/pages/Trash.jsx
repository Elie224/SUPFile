import React, { useEffect, useState } from 'react';
import { fileService, folderService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Trash() {
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    try {
      setLoading(true);
      setFiles([]);
      setFolders([]);
      
      // Charger les fichiers supprimés
      const filesResponse = await fileService.listTrash();
      if (filesResponse?.data?.data?.items) {
        setFiles(filesResponse.data.data.items);
      }
      
      // Charger les dossiers supprimés
      const foldersResponse = await folderService.listTrash();
      if (foldersResponse?.data?.data?.items) {
        setFolders(foldersResponse.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error?.message || err.message || t('loadError');
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const restoreFile = async (fileId) => {
    try {
      await fileService.restore(fileId);
      loadTrash();
      alert(t('file') + ' ' + t('restoreSuccess'));
    } catch (err) {
      console.error('Failed to restore file:', err);
      alert(t('restoreError'));
    }
  };

  const restoreFolder = async (folderId) => {
    try {
      await folderService.restore(folderId);
      loadTrash();
      alert(t('folder') + ' ' + t('restoreSuccess'));
    } catch (err) {
      console.error('Failed to restore folder:', err);
      alert(t('restoreError'));
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const locale = language === 'en' ? 'en-US' : 'fr-FR';
    return new Date(date).toLocaleString(locale);
  };

  if (loading) {
    return <div style={{ padding: 24 }}>{t('loading')}</div>;
  }

  const allItems = [
    ...files.map(f => ({ ...f, type: 'file' })),
    ...folders.map(f => ({ ...f, type: 'folder' }))
  ].sort((a, b) => {
    const dateA = new Date(a.deleted_at || a.created_at);
    const dateB = new Date(b.deleted_at || b.created_at);
    return dateB - dateA;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '28px',
        marginBottom: '24px',
        fontWeight: '700',
        color: '#333'
      }}>🗑️ {t('trash')}</h1>
      
      {allItems.length === 0 ? (
        <div style={{ 
          padding: '48px 24px', 
          textAlign: 'center', 
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
          <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>{t('trashEmpty')}</p>
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: '20px',
            padding: '16px 20px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
            border: '1px solid #ffcc80'
          }}>
            <p style={{ margin: 0, color: '#e65100', fontSize: '15px', fontWeight: '500' }}>
              📊 {allItems.length} {allItems.length > 1 ? t('itemsInTrashPlural') : t('itemsInTrash')}
            </p>
          </div>
          
          <div style={{ 
            overflowX: 'auto', 
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
                  }}>{t('deletedOn')}</th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item, index) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: index < allItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f7ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
                    }}
                  >
                    <td style={{ padding: '16px', fontSize: '15px' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: item.type === 'folder' ? '20px' : '18px' }}>
                          {item.type === 'folder' ? '📁' : '📄'}
                        </span>
                        <span style={{ fontWeight: item.type === 'folder' ? '600' : '400', color: item.type === 'folder' ? '#2196F3' : '#333' }}>
                          {item.name}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                      {item.type === 'folder' ? t('folder') : item.mime_type || t('file')}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                      {item.type === 'file' ? formatBytes(item.size) : '-'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                      {formatDate(item.deleted_at)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        onClick={() => item.type === 'file' ? restoreFile(item.id) : restoreFolder(item.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          transition: 'background-color 0.2s',
                          boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
                      >
                        {t('restore')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

