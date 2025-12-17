import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileService, folderService, shareService, userService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Files() {
  const navigate = useNavigate();
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [showShareModal, setShowShareModal] = useState(null);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiresAt, setShareExpiresAt] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [shareType, setShareType] = useState('public'); // 'public' ou 'internal'
  const [shareUserSearch, setShareUserSearch] = useState('');
  const [shareUsers, setShareUsers] = useState([]);
  const [selectedShareUser, setSelectedShareUser] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToMove, setItemToMove] = useState(null);
  const [availableFolders, setAvailableFolders] = useState([]);
  const [selectedDestinationFolder, setSelectedDestinationFolder] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fileService.list(currentFolder?.id || null);
      setItems(response.data.data.items || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const progress = {};
    try {
      for (const file of files) {
        progress[file.name] = 0;
        setUploadProgress({ ...progress });
        
        try {
          await fileService.upload(
            file, 
            currentFolder?.id || null,
            (percent) => {
              progress[file.name] = percent;
              setUploadProgress({ ...progress });
            }
          );
          progress[file.name] = 100;
          setUploadProgress({ ...progress });
        } catch (fileErr) {
          console.error(`Upload failed for ${file.name}:`, fileErr);
          const errorMsg = fileErr.response?.data?.error?.message || fileErr.message || t('uploadError');
          alert(`${t('error')} ${file.name}: ${errorMsg}`);
          progress[file.name] = -1; // Marquer comme échoué
          setUploadProgress({ ...progress });
        }
      }
      
      // Recharger la liste des fichiers après tous les uploads
      await loadFiles();
      setUploadProgress({});
    } catch (err) {
      console.error('Upload failed:', err);
      alert(t('uploadError') + ': ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await folderService.create(newFolderName.trim(), currentFolder?.id || null);
      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles();
    } catch (err) {
      console.error('Failed to create folder:', err);
      alert(t('createFolderError'));
    }
  };

  const renameItem = async () => {
    if (!editName.trim() || !editingItem) return;
    try {
      if (editingItem.type === 'folder') {
        await folderService.rename(editingItem.id, editName.trim());
      } else {
        await fileService.rename(editingItem.id, editName.trim());
      }
      setEditingItem(null);
      setEditName('');
      loadFiles();
    } catch (err) {
      console.error('Failed to rename:', err);
      alert(t('renameError'));
    }
  };

  const deleteItem = (item) => {
    console.log('=== DELETE ITEM REQUEST ===');
    console.log('Item received:', item);
    
    if (!item) {
      console.error('❌ No item provided');
      alert('Erreur: aucun élément sélectionné');
      return;
    }
    
    const itemId = item.id || item._id;
    if (!itemId) {
      console.error('❌ Item has no id:', item);
      alert('Erreur: l\'élément n\'a pas d\'identifiant');
      return;
    }
    
    // Stocker l'item à supprimer et afficher la modal
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) {
      console.error('❌ No item to delete');
      return;
    }
    
    const item = itemToDelete;
    const itemId = item.id || item._id;
    const itemName = item.name || 'cet élément';
    const itemType = item.type || (item.folder_id !== undefined ? 'file' : 'folder');
    
    console.log('=== CONFIRM DELETE START ===');
    console.log('Deleting:', { id: itemId, name: itemName, type: itemType });
    
    // Fermer la modal
    setItemToDelete(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour supprimer');
      }
      
      const endpoint = itemType === 'folder' 
        ? `${apiUrl}/api/folders/${itemId}`
        : `${apiUrl}/api/files/${itemId}`;
      
      console.log('Making DELETE request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      const responseData = await response.json().catch(() => ({ message: 'No JSON response' }));
      console.log('Response data:', responseData);
      
      if (!response.ok) {
        const errorMsg = responseData.error?.message || responseData.message || `Erreur ${response.status}`;
        console.error('❌ Delete failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('✅ Deletion successful!');
      
      // Recharger la liste après suppression
      await loadFiles();
      
      alert(`✅ "${itemName}" a été supprimé avec succès\n\nVous pouvez le restaurer depuis la corbeille si nécessaire.`);
    } catch (err) {
      console.error('❌ Deletion error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
      
      const errorMessage = err.message || 'Erreur lors de la suppression';
      alert(`❌ ${t('deleteError')}:\n\n${errorMessage}\n\n${t('language') === 'en' ? 'Check the console (F12) for more details.' : 'Vérifiez la console (F12) pour plus de détails.'}`);
    }
    
    console.log('=== CONFIRM DELETE END ===');
  };

  // Rechercher des utilisateurs pour le partage interne
  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setShareUsers([]);
      return;
    }
    try {
      const response = await userService.listUsers(searchTerm);
      setShareUsers(response.data.data || []);
    } catch (err) {
      console.error('Failed to search users:', err);
      setShareUsers([]);
    }
  };

  useEffect(() => {
    if (shareType === 'internal' && shareUserSearch) {
      const timeoutId = setTimeout(() => {
        searchUsers(shareUserSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setShareUsers([]);
    }
  }, [shareUserSearch, shareType]);

  const shareItem = async () => {
    if (!showShareModal) return;
    
    // Vérifier que l'utilisateur est connecté
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert(t('mustBeConnected') + '. ' + (t('language') === 'en' ? 'Redirecting to login...' : 'Redirection vers la page de connexion...'));
      navigate('/login');
      return;
    }
    
    try {
      // Partage interne
      if (shareType === 'internal') {
        if (!selectedShareUser) {
          alert(t('selectUserError'));
          return;
        }
        
        const response = await shareService.shareWithUser(
          showShareModal.type === 'file' ? showShareModal.id : null,
          showShareModal.type === 'folder' ? showShareModal.id : null,
          selectedShareUser.id
        );
        
        if (response.data) {
          alert(`${t('share')} ${t('success')}: ${selectedShareUser.email || selectedShareUser.display_name}`);
          setShowShareModal(null);
          setSharePassword('');
          setShareExpiresAt('');
          setShareType('public');
          setSelectedShareUser(null);
          setShareUserSearch('');
        }
        return;
      }
      
      // Partage public
      const options = {};
      
      // Gérer le mot de passe
      if (sharePassword && typeof sharePassword === 'string' && sharePassword.trim() !== '') {
        if (sharePassword.trim().length < 6) {
          alert(t('passwordMinLength'));
          return;
        }
        options.password = sharePassword.trim();
      }
      
      // Gérer la date d'expiration
      if (shareExpiresAt) {
        // Si c'est une string, l'utiliser directement
        if (typeof shareExpiresAt === 'string' && shareExpiresAt.trim() !== '') {
          options.expiresAt = shareExpiresAt.trim();
        }
        // Sinon, convertir en ISO string si c'est une Date
        else if (shareExpiresAt instanceof Date) {
          options.expiresAt = shareExpiresAt.toISOString();
        }
        // Sinon, essayer de convertir en string
        else {
          options.expiresAt = String(shareExpiresAt);
        }
      }
      
      console.log('Creating share with options:', { ...options, fileId: showShareModal.id, type: showShareModal.type });
      
      let response;
      if (showShareModal.type === 'file') {
        response = await shareService.generatePublicLink(showShareModal.id, options);
      } else {
        response = await shareService.generateFolderLink(showShareModal.id, options);
      }
      
      if (response.data && response.data.data) {
        const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://supfile-frontend.onrender.com';
        const shareUrl = response.data.data.share_url || `${frontendUrl}/share/${response.data.data.public_token}`;
        setShareLink(shareUrl);
        setSharePassword('');
        setShareExpiresAt('');
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (err) {
      console.error('Failed to share:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.error?.details?.[0]?.message || err.message || 'Erreur lors de la création du partage';
      
      // Si c'est une erreur 401, rediriger vers login
      if (err.response?.status === 401) {
        alert('Votre session a expiré. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        alert(errorMsg);
      }
    }
  };

  const openFolder = (folder) => {
    if (currentFolder) {
      setFolderHistory([...folderHistory, currentFolder]);
    }
    setCurrentFolder(folder);
  };

  const goBack = () => {
    if (folderHistory.length > 0) {
      const previousFolder = folderHistory[folderHistory.length - 1];
      setFolderHistory(folderHistory.slice(0, -1));
      setCurrentFolder(previousFolder);
    } else {
      setCurrentFolder(null);
      setFolderHistory([]);
    }
  };

  // Charger tous les dossiers disponibles pour le déplacement
  const loadAvailableFolders = async () => {
    try {
      setLoadingFolders(true);
      const response = await folderService.list(null);
      const allFolders = response.data.data?.items || [];
      
      // Filtrer pour exclure le dossier actuel et ses enfants si on déplace un dossier
      const filteredFolders = allFolders.filter(folder => {
        if (itemToMove && itemToMove.type === 'folder') {
          // Ne pas permettre de déplacer un dossier dans lui-même ou ses enfants
          return folder.id !== itemToMove.id;
        }
        return true;
      });
      
      setAvailableFolders(filteredFolders);
    } catch (err) {
      console.error('Failed to load folders:', err);
      setAvailableFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  };

  // Ouvrir la modal de déplacement
  const openMoveModal = (item) => {
    setItemToMove(item);
    setSelectedDestinationFolder(null);
    loadAvailableFolders();
  };

  // Effectuer le déplacement
  const confirmMove = async () => {
    if (!itemToMove || selectedDestinationFolder === undefined) return;
    
    try {
      if (itemToMove.type === 'file') {
        await fileService.move(itemToMove.id, selectedDestinationFolder);
      } else {
        await folderService.move(itemToMove.id, selectedDestinationFolder);
      }
      
      alert(`${t('move')} ${t('success')}`);
      setItemToMove(null);
      setSelectedDestinationFolder(null);
      loadFiles();
    } catch (err) {
      console.error('Failed to move:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || t('moveError');
      alert(errorMsg);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const breadcrumbs = currentFolder 
    ? [...folderHistory.map(f => f.name), currentFolder.name]
    : [];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* En-tête amélioré */}
      <div style={{ 
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              marginBottom: '8px',
              fontSize: '28px',
              fontWeight: '700',
              color: '#333'
            }}>📁 {t('myFiles')}</h1>
            {breadcrumbs.length > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flexWrap: 'wrap',
                fontSize: '14px',
                color: '#666'
              }}>
                <button 
                  onClick={goBack} 
                  style={{ 
                    padding: '6px 12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e0e0e0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                  }}
                >
                  ← {t('back')}
                </button>
                <span style={{ color: '#999' }}>|</span>
                <span 
                  onClick={() => { setCurrentFolder(null); setFolderHistory([]); }} 
                  style={{ 
                    cursor: 'pointer', 
                    color: '#2196F3',
                    fontWeight: '500',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#1976D2'}
                  onMouseLeave={(e) => e.target.style.color = '#2196F3'}
                >
                  {t('root')}
                </span>
                {breadcrumbs.map((name, idx) => (
                  <React.Fragment key={idx}>
                    <span style={{ color: '#999' }}>/</span>
                    <span style={{ color: '#666' }}>{name}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#2196F3', 
                color: 'white', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                display: 'inline-block',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1976D2';
                e.target.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2196F3';
                e.target.style.boxShadow = '0 2px 4px rgba(33, 150, 243, 0.3)';
              }}
            >
              📤 {t('upload')}
            </label>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#45a049';
                e.target.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#4CAF50';
                e.target.style.boxShadow = '0 2px 4px rgba(76, 175, 80, 0.3)';
              }}
            >
              📁 {t('newFolder')}
            </button>
          </div>
        </div>
      </div>

      {showNewFolder && (
        <div style={{ marginBottom: 16, padding: 16, border: '1px solid #ddd', borderRadius: 4 }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder={t('folderName')}
            onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            style={{ padding: 8, width: 300, marginRight: 8 }}
          />
          <button onClick={createFolder} style={{ padding: '8px 16px', marginRight: 8 }}>{t('create')}</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>{t('cancel')}</button>
        </div>
      )}

      {editingItem && (
        <div style={{ marginBottom: 16, padding: 16, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff9c4' }}>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t('renameItem')}
            onKeyPress={(e) => e.key === 'Enter' && renameItem()}
            style={{ padding: 8, width: 300, marginRight: 8 }}
            autoFocus
          />
          <button onClick={renameItem} style={{ padding: '8px 16px', marginRight: 8 }}>{t('rename')}</button>
          <button onClick={() => { setEditingItem(null); setEditName(''); }}>{t('cancel')}</button>
        </div>
      )}

      {showShareModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2>{t('shareModal')} {showShareModal.name}</h2>
            {!shareLink ? (
              <>
                {/* Type de partage */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>{t('shareType')}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setShareType('public'); setSelectedShareUser(null); setShareUserSearch(''); }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: shareType === 'public' ? '#2196F3' : '#f0f0f0',
                        color: shareType === 'public' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      {t('publicLink')}
                    </button>
                    <button
                      onClick={() => { setShareType('internal'); setSharePassword(''); setShareExpiresAt(''); }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: shareType === 'internal' ? '#2196F3' : '#f0f0f0',
                        color: shareType === 'internal' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        flex: 1
                      }}
                    >
                      {t('shareWithUser')}
                    </button>
                  </div>
                </div>

                {/* Partage public */}
                {shareType === 'public' && (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 4 }}>{t('sharePassword')}</label>
                      <input
                        type="password"
                        value={sharePassword}
                        onChange={(e) => setSharePassword(e.target.value)}
                        style={{ padding: 8, width: '100%' }}
                        placeholder={t('language') === 'en' ? 'Leave empty for public sharing' : 'Laissez vide pour un partage public'}
                      />
                      <small style={{ color: '#666', fontSize: '12px' }}>{t('passwordMinLength')}</small>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 4 }}>{t('shareExpiresAt')}</label>
                      <input
                        type="datetime-local"
                        lang={language === 'en' ? 'en-US' : 'fr-FR'}
                        value={shareExpiresAt}
                        onChange={(e) => setShareExpiresAt(e.target.value)}
                        style={{ padding: 8, width: '100%' }}
                      />
                    </div>
                  </>
                )}

                {/* Partage interne */}
                {shareType === 'internal' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>{t('searchUser')}</label>
                    <input
                      type="text"
                      value={shareUserSearch}
                      onChange={(e) => setShareUserSearch(e.target.value)}
                      style={{ padding: 8, width: '100%' }}
                      placeholder={t('language') === 'en' ? 'Type an email or name...' : 'Tapez un email ou un nom...'}
                    />
                    {shareUsers.length > 0 && (
                      <div style={{ marginTop: 8, border: '1px solid #ddd', borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                        {shareUsers.map(user => (
                          <div
                            key={user.id}
                            onClick={() => setSelectedShareUser(user)}
                            style={{
                              padding: 12,
                              cursor: 'pointer',
                              backgroundColor: selectedShareUser?.id === user.id ? '#e3f2fd' : 'white',
                              borderBottom: '1px solid #eee'
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{user.display_name || user.email}</div>
                            {user.display_name && <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedShareUser && (
                      <div style={{ marginTop: 8, padding: 8, backgroundColor: '#e8f5e9', borderRadius: 4 }}>
                        {t('shareWith')}: {selectedShareUser.display_name || selectedShareUser.email}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={shareItem} 
                    style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {shareType === 'public' ? t('generateLink') : t('share')}
                  </button>
                  <button 
                    onClick={() => { 
                      setShowShareModal(null); 
                      setShareLink(''); 
                      setSharePassword(''); 
                      setShareExpiresAt('');
                      setShareType('public');
                      setSelectedShareUser(null);
                      setShareUserSearch('');
                    }} 
                    style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Lien de partage :</label>
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    style={{ padding: 8, width: '100%', backgroundColor: 'white' }}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      alert('Lien copié dans le presse-papiers !');
                    }}
                    style={{ marginTop: 8, padding: '4px 8px', fontSize: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Copier le lien
                  </button>
                </div>
                <button 
                  onClick={() => { setShowShareModal(null); setShareLink(''); setSharePassword(''); setShareExpiresAt(''); }} 
                  style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {uploading && (
        <div style={{ padding: 8, backgroundColor: '#fff3cd', marginBottom: 16, borderRadius: 4 }}>
          <div>Upload en cours...</div>
          {Object.keys(uploadProgress).map(fileName => (
            <div key={fileName} style={{ marginTop: 4 }}>
              {fileName}: {uploadProgress[fileName]}%
            </div>
          ))}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ 
          minHeight: 400, 
          border: '2px dashed #ddd', 
          borderRadius: '12px', 
          padding: '32px',
          backgroundColor: '#fafafa',
          transition: 'all 0.3s'
        }}
        onDragEnter={(e) => {
          e.currentTarget.style.borderColor = '#2196F3';
          e.currentTarget.style.backgroundColor = '#f0f7ff';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = '#ddd';
          e.currentTarget.style.backgroundColor = '#fafafa';
        }}
      >
        {loading ? (
          <div>{t('loading')}</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999' }}>
            <p>{t('emptyFolder')}</p>
          </div>
        ) : (
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
                {items.map((item, index) => {
                  // S'assurer que le type est bien défini
                  const itemType = item.type || (item.folder_id === null && item.parent_id === null ? 'folder' : 'file');
                  const itemId = item.id || item._id;
                  
                  return (
                  <tr 
                    key={itemId} 
                    style={{ 
                      borderBottom: index < items.length - 1 ? '1px solid #f0f0f0' : 'none',
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
                    <td style={{ padding: '16px' }}>
                      {itemType === 'folder' ? (
                        <span
                          onClick={() => openFolder({ ...item, type: itemType, id: itemId })}
                          style={{ 
                            cursor: 'pointer', 
                            fontWeight: '600', 
                            color: '#2196F3',
                            fontSize: '15px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#1976D2'}
                          onMouseLeave={(e) => e.target.style.color = '#2196F3'}
                        >
                          <span style={{ fontSize: '20px' }}>📁</span> {item.name}
                        </span>
                      ) : (
                        <span
                          onClick={() => navigate(`/preview/${itemId}`)}
                          style={{ 
                            cursor: 'pointer',
                            fontSize: '15px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#333',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                          onMouseLeave={(e) => e.target.style.color = '#333'}
                        >
                          <span style={{ fontSize: '18px' }}>📄</span> {item.name}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>{formatBytes(item.size || 0)}</td>
                    <td style={{ padding: '16px', color: '#666', fontSize: '14px' }}>{new Date(item.updated_at || item.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}</td>
                    <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {itemType === 'file' && (
                        <>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
                                const token = localStorage.getItem('access_token');
                                
                                if (!token) {
                                  alert(t('mustBeConnected'));
                                  return;
                                }
                                
                                const response = await fetch(`${apiUrl}/api/files/${itemId}/download`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                if (!response.ok) {
                                  const error = await response.json().catch(() => ({ error: { message: t('downloadError') } }));
                                  throw new Error(error.error?.message || `${t('error')} ${response.status}`);
                                }
                                
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = item.name;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (err) {
                                console.error('Download failed:', err);
                                alert(err.message || t('downloadError'));
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title={t('download')}
                          >
                            ⬇️ {t('download')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowShareModal({ id: itemId, name: item.name, type: 'file' });
                              setShareLink('');
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title={t('share')}
                          >
                            🔗 {t('share')}
                          </button>
                        </>
                      )}
                      {itemType === 'folder' && (
                        <>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
                                const token = localStorage.getItem('access_token');
                                
                                if (!token) {
                                  alert(t('mustBeConnected'));
                                  return;
                                }
                                
                                const response = await fetch(`${apiUrl}/api/folders/${itemId}/download`, {
                                  headers: {
                                    'Authorization': `Bearer ${token}`
                                  }
                                });
                                
                                if (!response.ok) {
                                  const error = await response.json().catch(() => ({ error: { message: t('downloadError') } }));
                                  throw new Error(error.error?.message || `${t('error')} ${response.status}`);
                                }
                                
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${item.name}.zip`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              } catch (err) {
                                console.error('Download failed:', err);
                                alert(err.message || t('downloadError'));
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title={t('downloadZip')}
                          >
                            ⬇️ {t('downloadZip')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowShareModal({ id: itemId, name: item.name, type: 'folder' });
                              setShareLink('');
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title={t('share')}
                          >
                            🔗 {t('share')}
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingItem({ ...item, type: itemType, id: itemId });
                          setEditName(item.name);
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.9em',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={t('rename')}
                      >
                        ✏️ {t('rename')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openMoveModal({ ...item, type: itemType, id: itemId });
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#9C27B0',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.9em',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={t('move')}
                      >
                        📦 {t('move')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteItem({ ...item, type: itemType, id: itemId });
                        }}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.9em',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={t('delete')}
                      >
                        🗑️ {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal de déplacement */}
      {itemToMove && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>
              📦 {t('move')} "{itemToMove.name}"
            </h2>
            
            {loadingFolders ? (
              <div>{t('loading')}</div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 8 }}>{t('selectDestination')}</label>
                  <select
                    value={selectedDestinationFolder || ''}
                    onChange={(e) => setSelectedDestinationFolder(e.target.value || null)}
                    style={{ padding: 8, width: '100%', fontSize: 14 }}
                  >
                    <option value="">{t('root')}</option>
                    {availableFolders.map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setItemToMove(null);
                      setSelectedDestinationFolder(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={confirmMove}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {t('move')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {itemToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 24,
            borderRadius: 12,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>
              ⚠️ {t('deleteConfirm')}
            </h2>
            <p style={{ marginBottom: 24, color: '#666', fontSize: '1.1em' }}>
              {t('deleteConfirm')} <strong>"{itemToDelete.name}"</strong> ?
            </p>
            <p style={{ marginBottom: 24, color: '#999', fontSize: '0.9em' }}>
              {t('deleteConfirmDetails')} {itemToDelete.type === 'folder' ? t('folder') : t('file')}.
              {t('language') === 'en' ? ' You can restore it later if needed.' : ' Vous pourrez le restaurer plus tard si nécessaire.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  console.log('User cancelled deletion in modal');
                  setItemToDelete(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold'
                }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold'
                }}
              >
                🗑️ {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
