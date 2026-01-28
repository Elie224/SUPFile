import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fileService, folderService, shareService, userService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/Toast';

export default function Files() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render
  const toast = useToast(); // Système de notifications
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
  const [error, setError] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [sortBy, setSortBy] = useState(null); // 'name', 'size', 'modified'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedItems, setSelectedItems] = useState([]); // IDs des éléments sélectionnés
  const [isDragOver, setIsDragOver] = useState(false);
  const [downloadingFolder, setDownloadingFolder] = useState(null); // ID du dossier en cours de téléchargement

  // Charger le dossier depuis les paramètres URL au montage
  useEffect(() => {
    const folderId = searchParams.get('folder');
    if (folderId && folderId !== currentFolder?.id) {
      // Charger les informations du dossier
      folderService.get(folderId).then(response => {
        setCurrentFolder(response.data.data);
        setError(null);
      }).catch(err => {
        console.error('Failed to load folder:', err);
        setError('Impossible de charger le dossier: ' + (err.response?.data?.error?.message || err.message || 'Erreur inconnue'));
      });
    }
  }, [searchParams]);

  useEffect(() => {
    loadFiles();
  }, [currentFolder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileService.list(currentFolder?.id || null);
      const items = response.data.data.items || [];
      
      // Logs pour diagnostiquer la structure des items
      console.log('========================================');
      console.log('📁 LOADED FILES AND FOLDERS');
      console.log('========================================');
      console.log('Total items:', items.length);
      items.forEach((item, index) => {
        if (item.type === 'folder' || (!item.type && !item.folder_id)) {
          console.log(`Folder ${index}:`, {
            id: item.id,
            _id: item._id,
            name: item.name,
            type: item.type,
            hasId: !!item.id,
            has_id: !!item._id,
            idLength: item.id?.length,
            _idLength: item._id?.length
          });
        }
      });
      console.log('========================================');
      
      setItems(items);
    } catch (err) {
      console.error('Failed to load files:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Erreur inconnue';
      const statusCode = err.response?.status;
      
      let userMessage;
      
      // Messages d'erreur détaillés selon le type d'erreur
      if (statusCode === 401) {
        userMessage = t('errorSessionExpired') || 'Votre session a expiré. Veuillez vous reconnecter.';
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (statusCode === 403) {
        userMessage = t('errorAccessDenied') || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      } else if (statusCode === 404) {
        userMessage = t('errorFolderNotFound') || 'Dossier non trouvé.';
      } else if (statusCode === 429) {
        userMessage = t('errorRateLimit') || 'Trop de requêtes. Veuillez patienter quelques instants.';
      } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
        userMessage = t('errorServer') || 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (!err.response) {
        userMessage = t('errorNetwork') || 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      } else {
        userMessage = `${t('loadError') || 'Erreur lors du chargement'}: ${errorMessage}`;
      }
      
      setError(userMessage);
      setItems([]); // Vider la liste en cas d'erreur
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
    
    // Validation des fichiers avant upload
    const MAX_FILE_SIZE = 30 * 1024 * 1024 * 1024; // 30 GB (quota max)
    const invalidFiles = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (trop volumineux: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      }
    }
    
    if (invalidFiles.length > 0) {
      setError(`Certains fichiers sont trop volumineux:\n${invalidFiles.join('\n')}\n\nTaille maximum: 30 GB`);
      return;
    }
    
    setUploading(true);
    setError(null);
    const progress = {};
    let successCount = 0;
    let failCount = 0;
    
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
          successCount++;
        } catch (fileErr) {
          console.error(`Upload failed for ${file.name}:`, fileErr);
          const errorMsg = fileErr.response?.data?.error?.message || fileErr.message || t('uploadError');
          setError(`${t('error')} ${file.name}: ${errorMsg}`);
          progress[file.name] = -1; // Marquer comme échoué
          setUploadProgress({ ...progress });
          failCount++;
        }
      }
      
      // Recharger la liste des fichiers après tous les uploads
      await loadFiles();
      
      // Message de succès/erreur
      if (successCount > 0 && failCount === 0) {
        setError(null);
        // Message de succès sera affiché via l'UI de progression
      } else if (failCount > 0) {
        setError(`${successCount} fichier(s) uploadé(s) avec succès, ${failCount} échec(s)`);
      }
      
      // Effacer la progression après 3 secondes
      setTimeout(() => {
        setUploadProgress({});
      }, 3000);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(t('uploadError') + ': ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Gestion de la sélection multiple
  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const selectAllItems = () => {
    if (selectedItems.length === sortedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedItems.map(item => item.id || item._id));
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Validation du nom de dossier
  const validateFolderName = (name) => {
    const errors = [];
    
    // Vide
    if (!name.trim()) {
      errors.push(t('folderNameRequired') || 'Le nom ne peut pas être vide');
      return errors;
    }
    
    // Trop long
    if (name.length > 255) {
      errors.push(t('folderNameTooLong') || 'Maximum 255 caractères');
    }
    
    // Caractères interdits
    const invalidChars = /[/\\?*:|"<>]/g;
    if (invalidChars.test(name)) {
      errors.push(t('folderNameInvalidChars') || 'Caractères interdits : / \\ ? * : | " < >');
    }
    
    // Vérifier les doublons
    const duplicate = items.find(item => 
      item.type === 'folder' && 
      item.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      errors.push(t('folderNameDuplicate') || 'Un dossier avec ce nom existe déjà');
    }
    
    return errors;
  };

  const createFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      toast.warning(t('folderNameRequired') || 'Veuillez entrer un nom pour le dossier');
      return;
    }
    
    // Valider le nom
    const validationErrors = validateFolderName(trimmedName);
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }
    
    setCreatingFolder(true);
    try {
      await folderService.create(trimmedName, currentFolder?.id || null);
      setNewFolderName('');
      setShowNewFolder(false);
      await loadFiles();
      // Message de succès
      setError(null);
      toast.success(`Dossier "${trimmedName}" créé avec succès`);
    } catch (err) {
      console.error('Failed to create folder:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || t('createFolderError');
      toast.error(errorMessage);
    } finally {
      setCreatingFolder(false);
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
      await loadFiles();
      toast.success(`${editingItem.type === 'folder' ? 'Dossier' : 'Fichier'} renommé en "${editName.trim()}"`);
    } catch (err) {
      console.error('Failed to rename:', err);
      toast.error(err.response?.data?.error?.message || t('renameError'));
    }
  };

  const deleteItem = (item) => {
    console.log('=== DELETE ITEM REQUEST ===');
    console.log('Item received:', item);
    
    if (!item) {
      console.error('❌ No item provided');
      toast.error('Erreur: aucun élément sélectionné');
      return;
    }
    
    const itemId = item.id || item._id;
    if (!itemId) {
      console.error('❌ Item has no id:', item);
      toast.error('Erreur: l\'élément n\'a pas d\'identifiant');
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
      if (itemType === 'folder') {
        await folderService.delete(itemId);
      } else {
        await fileService.delete(itemId);
      }
      
      console.log('✅ Deletion successful!');
      
      // Recharger la liste après suppression
      await loadFiles();
      
      toast.success(`"${itemName}" a été supprimé avec succès. Vous pouvez le restaurer depuis la corbeille.`);
    } catch (err) {
      console.error('❌ Deletion error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data
      });
      
      const errorMessage = err.response?.data?.error?.message || err.message || t('deleteError') || 'Erreur lors de la suppression';
      toast.error(errorMessage);
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
      toast.warning(t('mustBeConnected') + '. ' + (t('language') === 'en' ? 'Redirecting to login...' : 'Redirection vers la page de connexion...'));
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    
    try {
      // Partage interne
      if (shareType === 'internal') {
        if (!selectedShareUser) {
          toast.warning(t('selectUserError'));
          return;
        }
        
        const response = await shareService.shareWithUser(
          showShareModal.type === 'file' ? showShareModal.id : null,
          showShareModal.type === 'folder' ? showShareModal.id : null,
          selectedShareUser.id
        );
        
        if (response.data) {
          toast.success(`${t('share')} réussi avec ${selectedShareUser.email || selectedShareUser.display_name}`);
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
          toast.warning(t('passwordMinLength'));
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
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        toast.error(errorMsg);
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
      
      toast.success(`${t('move')} réussi`);
      setItemToMove(null);
      setSelectedDestinationFolder(null);
      await loadFiles();
    } catch (err) {
      console.error('Failed to move:', err);
      const errorMsg = err.response?.data?.error?.message || err.message || t('moveError');
      toast.error(errorMsg);
    }
  };

  // Fonction de tri
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Trier les items
  const sortedItems = [...items].sort((a, b) => {
    if (!sortBy) return 0;
    
    let aValue, bValue;
    
    if (sortBy === 'name') {
      aValue = (a.name || '').toLowerCase();
      bValue = (b.name || '').toLowerCase();
    } else if (sortBy === 'size') {
      aValue = a.size || 0;
      bValue = b.size || 0;
    } else if (sortBy === 'modified') {
      aValue = new Date(a.updated_at || a.created_at || 0).getTime();
      bValue = new Date(b.updated_at || b.created_at || 0).getTime();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

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
            }}>
              <i className="bi bi-folder-fill me-2"></i>
              {t('myFiles')}
            </h1>
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
              <i className="bi bi-upload me-2"></i>
              {t('upload')}
            </label>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              aria-label={t('newFolder') || 'Nouveau dossier'}
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
              <i className="bi bi-folder-plus me-2" aria-hidden="true"></i>
              {t('newFolder')}
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
          <button 
            onClick={createFolder} 
            disabled={creatingFolder}
            className="btn btn-primary"
            style={{ padding: '8px 16px', marginRight: 8 }}
          >
            {creatingFolder ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('creating') || 'Création...'}
              </>
            ) : (
              t('create')
            )}
          </button>
          <button 
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} 
            disabled={creatingFolder}
            className="btn btn-secondary"
          >
            {t('cancel')}
          </button>
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
                    className="btn btn-success btn-sm d-flex align-items-center gap-1"
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      toast.success(t('linkCopied') || 'Lien copié dans le presse-papiers !');
                    }}
                    style={{ marginTop: 8 }}
                  >
                    <i className="bi bi-clipboard"></i>
                    {t('copyLink') || 'Copier le lien'}
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

      {/* Indicateurs de progression upload améliorés */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="card shadow-md mb-3 fade-in">
          <div className="card-body">
            <h6 className="mb-3 d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
              {t('uploading') || 'Upload en cours...'}
            </h6>
            {Object.keys(uploadProgress).map(fileName => {
              const progress = uploadProgress[fileName];
              const isComplete = progress === 100;
              const isError = progress === -1;
              
              return (
                <div key={fileName} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small text-truncate me-2" style={{ maxWidth: '70%' }}>
                      <i className={`bi ${isError ? 'bi-x-circle text-danger' : isComplete ? 'bi-check-circle text-success' : 'bi-upload'} me-1`}></i>
                      {fileName}
                    </span>
                    <span className={`small fw-semibold ${isError ? 'text-danger' : isComplete ? 'text-success' : 'text-primary'}`}>
                      {isError ? 'Erreur' : isComplete ? 'Terminé' : `${progress}%`}
                    </span>
                  </div>
                  {!isError && (
                    <div className="progress" style={{ height: '24px' }}>
                      <div 
                        className={`progress-bar ${isComplete ? 'bg-success' : 'bg-primary'}`}
                        role="progressbar" 
                        style={{ width: `${Math.max(progress, 0)}%` }}
                      >
                        {progress > 5 && !isComplete && `${progress}%`}
                        {isComplete && <i className="bi bi-check-circle me-1"></i>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ 
          minHeight: 400, 
          border: isDragOver ? '2px dashed #2196F3' : '2px dashed #ddd',
          backgroundColor: isDragOver ? '#e3f2fd' : '#fafafa',
          borderRadius: '12px',
          padding: '32px',
          transition: 'all 0.3s ease'
        }}
        onDragEnter={(e) => {
          e.currentTarget.style.borderColor = '#2196F3';
          e.currentTarget.style.backgroundColor = '#f0f7ff';
        }}
      >
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">{t('loading') || 'Chargement...'}</span>
            </div>
            <p className="text-muted">{t('loading') || 'Chargement...'}</p>
          </div>
        ) : error ? (
          <div className="card shadow-sm border-danger mb-3">
            <div className="card-body text-center p-5">
              <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '48px' }}></i>
              <h5 className="mt-3 text-danger">{t('error') || 'Erreur'}</h5>
              <p className="text-muted mb-4">{error}</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setError(null);
                  loadFiles();
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                {t('retry') || 'Réessayer'}
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="card shadow-sm">
            <div className="card-body text-center p-5">
              <i className="bi bi-folder-x text-muted" style={{ fontSize: '64px' }}></i>
              <h5 className="mt-3 mb-2 text-muted">{t('emptyFolder') || 'Aucun fichier ou dossier'}</h5>
              <p className="text-muted mb-4">
                {t('emptyFolderDescription') || 'Glissez-déposez des fichiers ici ou cliquez sur "Uploader" pour commencer'}
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <label htmlFor="file-upload" className="btn btn-primary">
                  <i className="bi bi-upload me-2"></i>
                  {t('upload') || 'Uploader'}
                </label>
                <button className="btn btn-success" onClick={() => setShowNewFolder(!showNewFolder)}>
                  <i className="bi bi-folder-plus me-2"></i>
                  {t('newFolder') || 'Nouveau dossier'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Barre d'actions pour sélection multiple */}
            {selectedItems.length > 0 && (
              <div className="alert alert-info d-flex justify-content-between align-items-center mb-3" role="alert">
                <span>
                  <i className="bi bi-check2-square me-2"></i>
                  <strong>{selectedItems.length}</strong> {selectedItems.length > 1 ? 'éléments sélectionnés' : 'élément sélectionné'}
                </span>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      const selectedFiles = sortedItems.filter(item => 
                        selectedItems.includes(item.id || item._id) && 
                        (item.type === 'file' || (item.folder_id === null && item.parent_id === null ? false : true))
                      );
                      // Action à implémenter : télécharger/supprimer en masse
                      toast.info(`${selectedFiles.length} élément(s) sélectionné(s)`);
                    }}
                  >
                    <i className="bi bi-download me-1"></i>
                    Actions groupées
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={clearSelection}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Annuler
                  </button>
                </div>
              </div>
            )}
            
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
                      width: '40px'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                        onChange={selectAllItems}
                        style={{ cursor: 'pointer' }}
                        title={t('selectAll') || 'Tout sélectionner'}
                      />
                    </th>
                  <th 
                    onClick={() => handleSort('name')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}
                    tabIndex={0}
                    role="button"
                    aria-label={`Trier par ${t('name')}`}
                    aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    style={{ 
                      textAlign: 'left', 
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      outline: 'none'
                    }}
                  >
                    {t('name')} {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('size')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('size')}
                    tabIndex={0}
                    role="button"
                    aria-label={`Trier par ${t('size')}`}
                    aria-sort={sortBy === 'size' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    style={{ 
                      textAlign: 'left', 
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      outline: 'none'
                    }}
                  >
                    {t('size')} {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('modified')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('modified')}
                    tabIndex={0}
                    role="button"
                    aria-label={`Trier par ${t('modified')}`}
                    aria-sort={sortBy === 'modified' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    style={{ 
                      textAlign: 'left', 
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      outline: 'none'
                    }}
                  >
                    {t('modified')} {sortBy === 'modified' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
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
                {sortedItems.map((item, index) => {
                  // S'assurer que le type est bien défini
                  // Le backend ajoute déjà 'type: folder' ou 'type: file'
                  // Fallback: si folder_id existe, c'est un fichier, sinon c'est un dossier
                  const itemType = item.type || (item.folder_id !== undefined && item.folder_id !== null ? 'file' : 'folder');
                  
                  // Extraire l'ID avec vérification
                  let itemId = item.id || item._id;
                  
                  // Si l'ID n'est pas une string, le convertir
                  if (itemId && typeof itemId !== 'string') {
                    itemId = String(itemId);
                  }
                  
                  // Log si l'ID est manquant ou invalide pour un dossier
                  if (itemType === 'folder' && (!itemId || itemId.length !== 24)) {
                    console.error('❌ Invalid folder ID in map:', {
                      item,
                      itemId,
                      itemIdType: typeof itemId,
                      itemIdLength: itemId?.length,
                      itemIdValue: itemId,
                      hasId: !!item.id,
                      has_id: !!item._id,
                      idValue: item.id,
                      _idValue: item._id
                    });
                  }
                  
                  // Vérifier si c'est le dossier Root système
                  // Le backend retourne les dossiers avec type: 'folder' et peut avoir parent_id ou parentId
                  const parentId = item.parent_id !== undefined ? item.parent_id : (item.parentId !== undefined ? item.parentId : null);
                  const folderName = item.name || '';
                  
                  // Le dossier Root système a le nom exact "Root" (case-insensitive) et parent_id === null
                  // Les dossiers normaux à la racine ont aussi parent_id === null, mais ne sont pas "Root"
                  const isRootFolder = itemType === 'folder' && 
                    (folderName.toLowerCase() === 'root') && 
                    (parentId === null || parentId === undefined);
                  
                  // Debug: logger pour vérifier la détection (toujours actif pour diagnostiquer)
                  if (itemType === 'folder') {
                    console.log('Folder debug:', {
                      name: folderName,
                      parent_id: parentId,
                      parentId: item.parentId,
                      isRootFolder,
                      itemType,
                      item: item
                    });
                  }
                  
                  return (
                  <tr 
                    key={itemId} 
                    style={{ 
                      borderBottom: index < sortedItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: selectedItems.includes(itemId)
                        ? '#e3f2fd'
                        : (index % 2 === 0 ? '#ffffff' : '#fafafa'),
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
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemId)}
                        onChange={() => toggleItemSelection(itemId)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
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
                          <i className="bi bi-folder-fill text-warning me-2" style={{ fontSize: '20px' }}></i>
                          {item.name}
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
                          <i className="bi bi-file-earmark text-primary me-2" style={{ fontSize: '18px' }}></i>
                          {item.name}
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
                                  toast.warning(t('mustBeConnected'));
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
                                toast.error(err.message || t('downloadError'));
                              }
                            }}
                            className="btn btn-outline-primary btn-sm"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.9em',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title={t('download')}
                            aria-label={`${t('download')} ${item.name}`}
                          >
                            <i className="bi bi-download me-1" aria-hidden="true"></i>
                            {t('download')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowShareModal({ id: itemId, name: item.name, type: 'file' });
                              setShareLink('');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.9em',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title={t('share')}
                            aria-label={`${t('share')} ${item.name}`}
                          >
                            <i className="bi bi-share me-1" aria-hidden="true"></i>
                            {t('share')}
                          </button>
                        </>
                      )}
                      {itemType === 'folder' && (
                        <>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              if (downloadingFolder === itemId) {
                                return; // Déjà en cours de téléchargement
                              }
                              
                              setDownloadingFolder(itemId);
                              
                              try {
                                // Vérifier que l'ID est valide
                                if (!itemId) {
                                  console.error('❌ Item ID is missing:', { item, itemId, itemType });
                                  throw new Error('ID du dossier invalide');
                                }
                                
                                // Vérifier que l'ID est une string complète (ObjectId MongoDB = 24 caractères hex)
                                if (typeof itemId !== 'string' || itemId.length !== 24) {
                                  console.error('❌ Item ID format invalid:', { 
                                    itemId, 
                                    type: typeof itemId, 
                                    length: itemId?.length,
                                    item 
                                  });
                                  throw new Error(`ID du dossier invalide (format: ${typeof itemId}, longueur: ${itemId?.length})`);
                                }
                                
                                // Logs très visibles pour debug
                                console.log('========================================');
                                console.log('✅ DOWNLOADING FOLDER');
                                console.log('========================================');
                                console.log('itemId:', itemId);
                                console.log('itemId type:', typeof itemId);
                                console.log('itemId length:', itemId?.length);
                                console.log('itemName:', item.name);
                                console.log('itemType:', itemType);
                                console.log('item.id:', item.id);
                                console.log('item._id:', item._id);
                                console.log('item.type:', item.type);
                                console.log('Full item:', item);
                                console.log('========================================');
                                
                                toast.info(t('downloadStarting') || 'Téléchargement en cours...', 2000);
                                
                                // Vérification finale avant l'appel
                                console.log('========================================');
                                console.log('🚀 ABOUT TO CALL downloadAsZip');
                                console.log('========================================');
                                console.log('itemId FINAL:', itemId);
                                console.log('itemId FINAL type:', typeof itemId);
                                console.log('itemId FINAL length:', itemId?.length);
                                console.log('itemId FINAL value:', JSON.stringify(itemId));
                                console.log('========================================');
                                
                                const response = await folderService.downloadAsZip(itemId);
                                
                                if (!response.data || response.data.size === 0) {
                                  throw new Error('Le fichier ZIP est vide ou invalide');
                                }
                                
                                const blob = response.data;
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${item.name}.zip`;
                                document.body.appendChild(a);
                                a.click();
                                
                                // Nettoyer après un court délai
                                setTimeout(() => {
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                }, 100);
                                
                                toast.success(t('downloadSuccess') || 'Téléchargement réussi');
                              } catch (err) {
                                // Logs très visibles pour debug
                                console.error('========================================');
                                console.error('❌ DOWNLOAD FAILED');
                                console.error('========================================');
                                console.error('Error:', err);
                                console.error('Error code:', err.code);
                                console.error('Error message:', err.message);
                                console.error('Response status:', err.response?.status);
                                console.error('Response data:', err.response?.data);
                                console.error('Request URL:', err.config?.url);
                                console.error('Full error:', JSON.stringify(err, null, 2));
                                console.error('========================================');
                                
                                let errorMsg = t('downloadError') || 'Erreur lors du téléchargement';
                                
                                // Vérifier d'abord les erreurs réseau/connexion (503, 502, etc.)
                                if (err.response?.status === 503) {
                                  errorMsg = t('serverUnavailable') || 'Le serveur est temporairement indisponible. Les machines sont peut-être en veille. Veuillez réessayer dans quelques instants.';
                                } else if (err.response?.status === 502) {
                                  errorMsg = t('badGateway') || 'Erreur de passerelle. Le serveur ne répond pas correctement.';
                                } else if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || err.message?.includes('Failed to fetch'))) {
                                  errorMsg = t('networkError') || 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
                                } else if (err.response?.status === 404) {
                                  // Vérifier si c'est un dossier vide/orphelin
                                  let responseData = null;
                                  try {
                                    if (err.response.data instanceof Blob) {
                                      const text = await err.response.data.text();
                                      responseData = JSON.parse(text);
                                    } else {
                                      responseData = err.response.data;
                                    }
                                  } catch {
                                    // Ignorer si on ne peut pas parser
                                  }
                                  
                                  if (responseData?.error?.code === 'FOLDER_EMPTY_OR_ORPHANED') {
                                    errorMsg = responseData.error.message || 
                                      'Ce dossier ne contient aucun fichier accessible. Les fichiers ont probablement été perdus après un déploiement. Veuillez ré-uploader les fichiers ou supprimer ce dossier.';
                                    
                                    // Afficher aussi les détails si disponibles
                                    if (responseData.error.details?.suggestion) {
                                      errorMsg += '\n\n' + responseData.error.details.suggestion;
                                    }
                                  } else {
                                    errorMsg = responseData?.error?.message || t('folderNotFound') || 'Le dossier n\'a pas été trouvé.';
                                  }
                                } else if (err.response?.status === 403) {
                                  errorMsg = t('accessDenied') || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
                                } else if (err.code === 'ECONNABORTED') {
                                  // ECONNABORTED peut être un timeout OU une connexion interrompue
                                  // Vérifier si c'est vraiment un timeout (plus de 10 minutes) ou une erreur réseau
                                  if (err.message?.includes('timeout') || err.message?.includes('Timeout')) {
                                    errorMsg = t('downloadTimeout') || 'Le téléchargement a pris trop de temps (plus de 10 minutes). Le dossier est peut-être trop volumineux. Essayez de télécharger des fichiers individuellement.';
                                  } else {
                                    errorMsg = t('connectionAborted') || 'La connexion a été interrompue. Vérifiez votre connexion internet et réessayez.';
                                  }
                                } else if (err.message?.includes('aborted') || err.message?.includes('canceled')) {
                                  errorMsg = t('downloadAborted') || 'Le téléchargement a été annulé.';
                                } else if (err.response?.data) {
                                  // Si c'est un blob d'erreur, essayer de le lire
                                  if (err.response.data instanceof Blob) {
                                    try {
                                      const text = await err.response.data.text();
                                      const json = JSON.parse(text);
                                      errorMsg = json.error?.message || errorMsg;
                                    } catch {
                                      errorMsg = err.response.status === 403 
                                        ? t('accessDenied') || 'Accès refusé'
                                        : errorMsg;
                                    }
                                  } else {
                                    errorMsg = err.response.data.error?.message || errorMsg;
                                  }
                                } else if (err.message) {
                                  errorMsg = err.message;
                                }
                                
                                toast.error(errorMsg);
                              } finally {
                                setDownloadingFolder(null);
                              }
                            }}
                            disabled={downloadingFolder === itemId}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: downloadingFolder === itemId ? '#ccc' : '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: downloadingFolder === itemId ? 'wait' : 'pointer',
                              fontSize: '0.9em',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              opacity: downloadingFolder === itemId ? 0.7 : 1
                            }}
                            title={downloadingFolder === itemId ? (t('downloading') || 'Téléchargement en cours...') : t('downloadZip')}
                          >
                            {downloadingFolder === itemId ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                {t('downloading') || 'Téléchargement...'}
                              </>
                            ) : (
                              <>
                                <i className="bi bi-download me-1"></i>
                                {t('downloadZip')}
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowShareModal({ id: itemId, name: item.name, type: 'folder' });
                              setShareLink('');
                            }}
                            className="btn btn-primary btn-sm"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.9em',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title={t('share')}
                          >
                            <i className="bi bi-share me-1"></i>
                            {t('share')}
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
                        disabled={isRootFolder}
                        className="btn btn-outline-secondary btn-sm"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.9em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          opacity: isRootFolder ? 0.5 : 1,
                          cursor: isRootFolder ? 'not-allowed' : 'pointer'
                        }}
                        title={isRootFolder ? (t('cannotRenameRoot') || 'Impossible de renommer la racine') : t('rename')}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        {t('rename')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openMoveModal({ ...item, type: itemType, id: itemId });
                        }}
                        className="btn btn-outline-secondary btn-sm"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.9em',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title={t('move')}
                      >
                        <i className="bi bi-arrow-left-right me-1"></i>
                        {t('move')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isRootFolder) {
                            deleteItem({ ...item, type: itemType, id: itemId });
                          } else {
                            toast.warning(t('cannotDeleteRoot') || 'Impossible de supprimer la racine');
                          }
                        }}
                        disabled={isRootFolder}
                        className="btn btn-outline-danger btn-sm"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.9em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          opacity: isRootFolder ? 0.5 : 1,
                          cursor: isRootFolder ? 'not-allowed' : 'pointer'
                        }}
                        title={isRootFolder ? (t('cannotDeleteRoot') || 'Impossible de supprimer la racine') : t('delete')}
                      >
                        <i className="bi bi-trash me-1"></i>
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
                );
                })}
              </tbody>
          </table>
          </div>
          </>
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
              <i className="bi bi-arrow-left-right me-2"></i>
              {t('move')} "{itemToMove.name}"
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
                <i className="bi bi-trash me-2"></i>
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
