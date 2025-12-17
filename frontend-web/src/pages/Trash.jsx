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
    <div style={{ padding: 24 }}>
      <h1>{t('trash')}</h1>
      
      {allItems.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
          <p>{t('trashEmpty')}</p>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: 16, color: '#666' }}>
            {allItems.length} {allItems.length > 1 ? t('itemsInTrashPlural') : t('itemsInTrash')}
          </p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('name')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('type')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('size')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('deletedOn')}</th>
                <th style={{ textAlign: 'left', padding: 12 }}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}>
                    {item.type === 'folder' ? '📁' : '📄'} {item.name}
                  </td>
                  <td style={{ padding: 12 }}>
                    {item.type === 'folder' ? t('folder') : item.mime_type || t('file')}
                  </td>
                  <td style={{ padding: 12 }}>
                    {item.type === 'file' ? formatBytes(item.size) : '-'}
                  </td>
                  <td style={{ padding: 12 }}>
                    {formatDate(item.deleted_at)}
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => item.type === 'file' ? restoreFile(item.id) : restoreFolder(item.id)}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        marginRight: 8,
                      }}
                    >
                      {t('restore')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

