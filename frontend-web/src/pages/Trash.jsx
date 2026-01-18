import React, { useEffect, useState } from 'react';
import { fileService, folderService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Trash() {
  const { t, language } = useLanguage();
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    try {
      setLoading(true);
      setFiles([]);
      setFolders([]);
      
      const filesResponse = await fileService.listTrash();
      if (filesResponse?.data?.data?.items) {
        setFiles(filesResponse.data.data.items);
      }
      
      const foldersResponse = await folderService.listTrash();
      if (foldersResponse?.data?.data?.items) {
        setFolders(foldersResponse.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || t('loadError');
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const restoreFile = async (fileId) => {
    try {
      await fileService.restore(fileId);
      loadTrash();
      setMessage({ type: 'success', text: t('restoreSuccess') || 'Fichier restauré avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Failed to restore file:', err);
      setMessage({ type: 'error', text: t('restoreError') || 'Erreur lors de la restauration' });
    }
  };

  const restoreFolder = async (folderId) => {
    try {
      await folderService.restore(folderId);
      loadTrash();
      setMessage({ type: 'success', text: t('restoreSuccess') || 'Dossier restauré avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Failed to restore folder:', err);
      setMessage({ type: 'error', text: t('restoreError') || 'Erreur lors de la restauration' });
    }
  };

  const emptyTrash = async () => {
    if (!confirm(t('confirmEmptyTrash') || 'Êtes-vous sûr de vouloir vider la corbeille ? Cette action est irréversible.')) {
      return;
    }

    try {
      // Supprimer définitivement tous les fichiers
      for (const file of files) {
        try {
          await fileService.delete(file.id);
        } catch (err) {
          console.error(`Failed to delete file ${file.id}:`, err);
        }
      }

      // Supprimer définitivement tous les dossiers
      for (const folder of folders) {
        try {
          await folderService.delete(folder.id);
        } catch (err) {
          console.error(`Failed to delete folder ${folder.id}:`, err);
        }
      }

      loadTrash();
      setMessage({ type: 'success', text: t('trashEmptied') || 'Corbeille vidée avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Failed to empty trash:', err);
      setMessage({ type: 'error', text: t('emptyTrashError') || 'Erreur lors du vidage de la corbeille' });
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
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center p-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">{t('loading')}</span>
          </div>
          <p className="text-muted">{t('loading')}</p>
        </div>
      </div>
    );
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
    <div className="container-fluid p-3 p-md-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h2 mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-trash text-danger"></i>
          {t('trash') || 'Corbeille'}
        </h1>
        {allItems.length > 0 && (
          <button
            className="btn btn-danger d-flex align-items-center gap-2"
            onClick={emptyTrash}
            style={{ minHeight: '44px' }}
          >
            <i className="bi bi-trash3"></i>
            {t('emptyTrash') || 'Vider la corbeille'}
          </button>
        )}
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} d-flex align-items-center gap-2 mb-3`} role="alert">
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      {allItems.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center p-5">
            <i className="bi bi-trash text-muted" style={{ fontSize: '64px' }}></i>
            <h5 className="mt-3 mb-2 text-muted">{t('trashEmpty') || 'Corbeille vide'}</h5>
            <p className="text-muted mb-0">
              {t('trashEmptyDescription') || 'Les fichiers supprimés apparaîtront ici'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Info nombre d'éléments */}
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-info-circle"></i>
            <span>
              <strong>{allItems.length}</strong> {allItems.length > 1 ? (t('itemsInTrashPlural') || 'éléments dans la corbeille') : (t('itemsInTrash') || 'élément dans la corbeille')}
            </span>
          </div>
          
          {/* Table des éléments */}
          <div className="card shadow-md">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
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
                        <i className="bi bi-calendar-x me-2"></i>
                        {t('deletedOn') || 'Supprimé le'}
                      </th>
                      <th style={{ padding: '16px' }}>
                        <i className="bi bi-gear me-2"></i>
                        {t('actions') || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{ padding: '16px' }}>
                          <div className="d-flex align-items-center gap-2">
                            {item.type === 'folder' ? (
                              <i className="bi bi-folder-fill text-warning" style={{ fontSize: '20px' }}></i>
                            ) : (
                              <i className="bi bi-file-earmark text-primary" style={{ fontSize: '20px' }}></i>
                            )}
                            <span className={item.type === 'folder' ? 'fw-semibold text-primary' : ''}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="text-muted">
                            {item.type === 'folder' ? (
                              <><i className="bi bi-folder me-1"></i> {t('folder') || 'Dossier'}</>
                            ) : (
                              item.mime_type || t('file') || 'Fichier'
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="text-muted">
                            {item.type === 'file' ? formatBytes(item.size) : '-'}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="text-muted small">{formatDate(item.deleted_at)}</span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            className="btn btn-success btn-sm d-flex align-items-center gap-1"
                            onClick={() => item.type === 'file' ? restoreFile(item.id) : restoreFolder(item.id)}
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                            {t('restore') || 'Restaurer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
