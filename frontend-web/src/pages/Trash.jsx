import React, { useEffect, useState } from 'react';
import { fileService, folderService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import offlineDB from '../services/offlineDB';
import { formatBytes } from '../utils/storageUtils';

export default function Trash() {
  const { t, language } = useLanguage();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fromCache, setFromCache] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    try {
      setLoading(true);
      setFiles([]);
      setFolders([]);
      setMessage({ type: '', text: '' });
      setFromCache(false);

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await offlineDB.init();
        const cachedFiles = await offlineDB.getUserMeta('trashFiles');
        const cachedFolders = await offlineDB.getUserMeta('trashFolders');
        if (Array.isArray(cachedFiles)) setFiles(cachedFiles);
        if (Array.isArray(cachedFolders)) setFolders(cachedFolders);
        if (Array.isArray(cachedFiles) || Array.isArray(cachedFolders)) setFromCache(true);
        setLoading(false);
        return;
      }

      const [filesResponse, foldersResponse] = await Promise.allSettled([
        fileService.listTrash(),
        folderService.listTrash()
      ]);

      if (filesResponse.status === 'fulfilled' && filesResponse.value?.data?.data?.items) {
        const items = filesResponse.value.data.data.items;
        setFiles(items);
        await offlineDB.setUserMeta('trashFiles', items);
      } else if (filesResponse.status === 'rejected') {
        console.error('Failed to load trash files:', filesResponse.reason);
      }

      if (foldersResponse.status === 'fulfilled' && foldersResponse.value?.data?.data?.items) {
        const items = foldersResponse.value.data.data.items;
        setFolders(items);
        await offlineDB.setUserMeta('trashFolders', items);
      } else if (foldersResponse.status === 'rejected') {
        console.error('Failed to load trash folders:', foldersResponse.reason);
      }

      if (filesResponse.status === 'rejected' && foldersResponse.status === 'rejected') {
        const cachedFiles = await offlineDB.getUserMeta('trashFiles');
        const cachedFolders = await offlineDB.getUserMeta('trashFolders');
        if (Array.isArray(cachedFiles)) setFiles(cachedFiles);
        if (Array.isArray(cachedFolders)) setFolders(cachedFolders);
        if (Array.isArray(cachedFiles) || Array.isArray(cachedFolders)) setFromCache(true);
        const errorMsg = filesResponse.reason?.response?.data?.error?.message 
          || foldersResponse.reason?.response?.data?.error?.message
          || filesResponse.reason?.message 
          || foldersResponse.reason?.message
          || t('loadError') || 'Erreur lors du chargement de la corbeille';
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || t('loadError') || 'Erreur lors du chargement de la corbeille';
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

  const getItemKey = (item) => `${item.type}:${item.id}`;

  const toggleSelect = (item) => {
    const key = getItemKey(item);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === allItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allItems.map((item) => getItemKey(item))));
    }
  };

  const deletePermanently = async (itemsToDelete) => {
    const list = Array.isArray(itemsToDelete) ? itemsToDelete : allItems.filter((item) => selectedIds.has(getItemKey(item)));
    if (list.length === 0) return;
    const label = t('confirmDeletePermanent');
    if (!confirm(`${label} ${list.length} élément(s) ? Cette action est irréversible.`)) return;

    let failed = 0;
    for (const item of list) {
      try {
        if (item.type === 'file') {
          await fileService.delete(item.id);
        } else {
          await folderService.delete(item.id);
        }
      } catch (err) {
        failed += 1;
        if (import.meta.env.DEV) console.error(`Failed to delete ${item.type} ${item.id}:`, err);
      }
    }
    setSelectedIds(new Set());
    await loadTrash();
    const successCount = list.length - failed;
    if (failed === 0) {
      setMessage({ type: 'success', text: t('deletePermanentSuccess') });
    } else if (failed === list.length) {
      setMessage({ type: 'error', text: t('deletePermanentError') });
    } else {
      const partialMsg = (t('deletePermanentPartial') || '{{success}} supprimé(s), {{failed}} n\'ont pas pu être supprimé(s).')
        .replace('{{success}}', String(successCount))
        .replace('{{failed}}', String(failed));
      setMessage({ type: 'warning', text: partialMsg });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const emptyTrash = async () => {
    if (!confirm(t('confirmEmptyTrash'))) return;

    let failed = 0;
    const total = files.length + folders.length;
    for (const file of files) {
      try {
        await fileService.delete(file.id);
      } catch (err) {
        failed += 1;
        if (import.meta.env.DEV) console.error('Failed to delete file', file.id, err);
      }
    }
    for (const folder of folders) {
      try {
        await folderService.delete(folder.id);
      } catch (err) {
        failed += 1;
        if (import.meta.env.DEV) console.error('Failed to delete folder', folder.id, err);
      }
    }
    setSelectedIds(new Set());
    await loadTrash();
    const successCount = total - failed;
    if (failed === 0) {
      setMessage({ type: 'success', text: t('trashEmptied') });
    } else if (failed === total) {
      setMessage({ type: 'error', text: t('emptyTrashError') });
    } else {
      const partialMsg = (t('trashEmptiedPartial') || '{{success}} supprimé(s), {{failed}} n\'ont pas pu être supprimé(s).')
        .replace('{{success}}', String(successCount))
        .replace('{{failed}}', String(failed));
      setMessage({ type: 'warning', text: partialMsg });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
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
        <div className={`alert alert-${message.type === 'success' ? 'success' : message.type === 'warning' ? 'warning' : 'danger'} d-flex align-items-center gap-2 mb-3`} role="alert">
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : message.type === 'warning' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      {fromCache && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" role="alert" style={{ fontSize: '14px' }}>
          <i className="bi bi-cloud-download"></i>
          <span>Données chargées depuis le cache local (mode hors ligne).</span>
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

          {/* Actions sur la sélection */}
          {selectedIds.size > 0 && (
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <span className="text-muted">
                {selectedIds.size} {selectedIds.size > 1 ? (t('selected') || 'sélectionné(s)') : (t('selectedOne') || 'sélectionné')}
              </span>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                onClick={() => deletePermanently()}
              >
                <i className="bi bi-trash3"></i>
                {t('deletePermanent') || 'Supprimer définitivement'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setSelectedIds(new Set())}
              >
                {t('deselectAll') || 'Tout désélectionner'}
              </button>
            </div>
          )}
          
          {/* Table des éléments */}
          <div className="card shadow-md">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                      <th style={{ padding: '16px', width: '44px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={allItems.length > 0 && selectedIds.size === allItems.length}
                          onChange={toggleSelectAll}
                          aria-label={t('selectAll') || 'Tout sélectionner'}
                        />
                      </th>
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
                    {allItems.map((item) => (
                      <tr key={getItemKey(item)}>
                        <td style={{ padding: '16px' }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.has(getItemKey(item))}
                            onChange={() => toggleSelect(item)}
                            aria-label={t('select') || 'Sélectionner'}
                          />
                        </td>
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
                          <div className="d-flex flex-wrap gap-1">
                            <button
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              onClick={() => item.type === 'file' ? restoreFile(item.id) : restoreFolder(item.id)}
                            >
                              <i className="bi bi-arrow-counterclockwise"></i>
                              {t('restore') || 'Restaurer'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                              onClick={() => deletePermanently([item])}
                              title={t('deletePermanent') || 'Supprimer définitivement'}
                            >
                              <i className="bi bi-trash3"></i>
                              <span className="d-none d-sm-inline">{t('deletePermanent') || 'Supprimer définitivement'}</span>
                            </button>
                          </div>
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
