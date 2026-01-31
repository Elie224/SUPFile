import React from 'react';

// Système de traduction pour l'application
const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    files: 'Fichiers',
    search: 'Recherche',
    trash: 'Corbeille',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    
    // Auth
    login: 'Connexion',
    signup: 'Créer un compte',
    email: 'E-mail',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    loginButton: 'Se connecter',
    loginLoading: 'Connexion...',
    signupButton: 'S\'inscrire',
    signupLoading: 'Inscription...',
    noAccount: 'Pas encore de compte ?',
    hasAccount: 'Déjà un compte ?',
    signupLink: 'S\'inscrire',
    loginLink: 'Connexion',
    fillAllFields: 'Veuillez remplir tous les champs',
    passwordsDontMatch: 'Les mots de passe ne correspondent pas',
    passwordMinLength: 'Le mot de passe doit contenir au moins 8 caractères',
    passwordRequiresUppercase: 'Le mot de passe doit contenir au moins une majuscule',
    passwordRequiresNumber: 'Le mot de passe doit contenir au moins un chiffre',
    passwordRequirements: 'Au moins 8 caractères, une majuscule et un chiffre',
    loginFailed: 'La connexion a échoué',
    signupFailed: 'L\'inscription a échoué',
    continueWith: 'Continuer avec',
    or: 'ou',
    
    // Pages
    myFiles: 'Mes fichiers',
    upload: 'Uploader',
    newFolder: 'Nouveau dossier',
    folderName: 'Nom du nouveau dossier',
    create: 'Créer',
    creating: 'Création...',
    folderNameRequired: 'Le nom ne peut pas être vide',
    folderNameTooLong: 'Maximum 255 caractères',
    folderNameInvalidChars: 'Caractères interdits : / \\ ? * : | " < >',
    folderNameDuplicate: 'Un dossier avec ce nom existe déjà',
    name: 'Nom',
    size: 'Taille',
    modified: 'Modifié',
    actions: 'Actions',
    download: 'Télécharger',
    downloadZip: 'Télécharger (ZIP)',
    share: 'Partager',
    sharedWithMe: 'Partagé avec moi',
    rename: 'Renommer',
    move: 'Déplacer',
    delete: 'Supprimer',
    cancel: 'Annuler',
    selectDestination: 'Sélectionner le dossier de destination',
    save: 'Enregistrer',
    close: 'Fermer',
    back: 'Retour',
    root: 'Racine',
    
    // Files page
    emptyFolder: 'Glissez-déposez des fichiers ici ou cliquez sur "Uploader"',
    emptyFolderDescription: 'Ce dossier est vide. Commencez par y ajouter des fichiers ou créer un nouveau dossier.',
    uploadInProgress: 'Upload en cours...',
    renameItem: 'Renommer',
    deleteConfirm: 'Voulez-vous vraiment supprimer',
    deleteConfirmDetails: 'Cette action enverra dans la corbeille.',
    deleteSuccess: 'a été supprimé et envoyé dans la corbeille.',
    deleteError: 'Erreur lors de la suppression',
    deletedOn: 'Supprimé le',
    restoreSuccess: 'Restauré avec succès',
    restoreError: 'Erreur lors de la restauration',
    emptyTrash: 'Vider la corbeille',
    trashEmptied: 'Corbeille vidée avec succès',
    emptyTrashError: 'Erreur lors du vidage de la corbeille',
    confirmEmptyTrash: 'Êtes-vous sûr de vouloir vider la corbeille ? Cette action est irréversible.',
    trashEmpty: 'Corbeille vide',
    trashEmptyDescription: 'Les fichiers supprimés apparaîtront ici',
    itemsInTrash: 'élément dans la corbeille',
    itemsInTrashPlural: 'éléments dans la corbeille',
    uploadError: 'Erreur lors de l\'upload',
    moveError: 'Erreur lors du déplacement',
    shareModal: 'Partager',
    shareType: 'Type de partage:',
    publicLink: 'Lien public',
    shareWithUser: 'Partager avec un utilisateur',
    sharePassword: 'Mot de passe (optionnel):',
    shareExpiresAt: 'Expire le (optionnel):',
    generateLink: 'Générer le lien',
    shareLinkGenerated: 'Lien de partage généré:',
    copyLink: 'Copier le lien',
    searchUser: 'Rechercher un utilisateur:',
    selectUser: 'Sélectionner un utilisateur',
    shareWith: 'Partagera avec:',
    linkCopied: 'Lien copié dans le presse-papiers !',
    shareError: 'Erreur lors de la génération du lien de partage',
    selectUserError: 'Veuillez sélectionner un utilisateur à partager avec.',
    
    // Dashboard
    storageSpace: 'Espace de stockage',
    used: 'Utilisé',
    available: 'Disponible',
    usedOf: 'utilisé sur',
    breakdownByType: 'Répartition par type',
    images: 'Images',
    videos: 'Vidéos',
    documents: 'Documents',
    audio: 'Audio',
    others: 'Autres',
    recentFiles: 'Fichiers récents',
    noRecentFiles: 'Aucun fichier récent',
    viewAll: 'Voir tout',
    statistics: 'Statistiques',
    totalFiles: 'Total fichiers',
    totalFolders: 'Total dossiers',
    
    // Search
    searchPlaceholder: 'Rechercher un fichier ou dossier...',
    searchButton: 'Rechercher',
    searching: 'Recherche en cours...',
    results: 'Résultats',
    noResults: 'Aucun résultat trouvé',
    startSearch: 'Commencez votre recherche',
    enterSearchTerms: 'Entrez des mots-clés dans le champ de recherche ci-dessus',
    tryDifferentSearch: 'Essayez avec d\'autres mots-clés ou modifiez les filtres',
    type: 'Type',
    all: 'Tous',
    allTypes: 'Tous les types',
    allFormats: 'Tous les formats',
    folders: 'Dossiers',
    file: 'Fichier',
    folder: 'Dossier',
    format: 'Format',
    dateFrom: 'Date début',
    dateTo: 'Date fin',
    modifiedPresets: 'Modifié :',
    modifiedToday: "Aujourd'hui",
    modifiedThisWeek: 'Cette semaine',
    modifiedLastWeek: 'La semaine dernière',
    modifiedThisMonth: 'Ce mois',
    modifiedLastMonth: 'Le mois dernier',
    mimeType: 'Type MIME',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    view: 'Voir',
    searchError: 'Erreur lors de la recherche',
    restore: 'Restaurer',

    // Settings
    accountInfo: 'Informations du compte',
    profile: 'Profil',
    security: 'Sécurité',
    preferences: 'Préférences',
    interfacePreferences: 'Préférences d\'interface',
    displayName: 'Nom d\'affichage',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    changePassword: 'Changer le mot de passe',
    language: 'Langue',
    languageLabel: 'Langue / Language',
    theme: 'Thème',
    lightTheme: 'Clair',
    darkTheme: 'Sombre',
    savePreferences: 'Enregistrer les préférences',
    notifications: 'Activer les notifications',
    spaceUsed: 'Espace utilisé',
    accountCreated: 'Compte créé le',
    lastLogin: 'Dernière connexion',
    never: 'Jamais',
    saveChanges: 'Enregistrer les modifications',
    saving: 'Enregistrement...',
    preferencesUpdated: 'Préférences mises à jour',
    passwordChanged: 'Mot de passe modifié avec succès',
    profileUpdated: 'Profil mis à jour avec succès',
    uploadAvatar: 'Changer l\'avatar',
    yourName: 'Votre nom',
    
    // Messages
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    yes: 'Oui',
    no: 'Non',
    mustBeConnected: 'Vous devez être connecté pour télécharger',
    downloadError: 'Erreur lors du téléchargement',
    renameError: 'Erreur lors du renommage',
    createFolderError: 'Erreur lors de la création du dossier',
    loadError: 'Erreur lors du chargement',
    errorSessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
    errorAccessDenied: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
    errorFolderNotFound: 'Dossier non trouvé.',
    errorRateLimit: 'Trop de requêtes. Veuillez patienter quelques instants.',
    errorServer: 'Erreur serveur. Veuillez réessayer plus tard.',
    errorNetwork: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    retry: 'Réessayer',
    errorLoadingDashboard: 'Impossible de charger le tableau de bord.',
    offlineNoCache: 'Hors ligne et aucune donnée en cache.',
    selectAll: 'Tout sélectionner',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    files: 'Files',
    search: 'Search',
    trash: 'Trash',
    settings: 'Settings',
    logout: 'Logout',
    
    // Auth
    login: 'Login',
    signup: 'Create account',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm password',
    loginButton: 'Login',
    loginLoading: 'Logging in...',
    signupButton: 'Sign up',
    signupLoading: 'Signing up...',
    noAccount: 'Don\'t have an account?',
    hasAccount: 'Already have an account?',
    signupLink: 'Sign up',
    loginLink: 'Login',
    fillAllFields: 'Please fill all fields',
    passwordsDontMatch: 'Passwords do not match',
    passwordMinLength: 'Password must contain at least 8 characters',
    passwordRequiresUppercase: 'Password must contain at least one uppercase letter',
    passwordRequiresNumber: 'Password must contain at least one number',
    passwordRequirements: 'At least 8 characters, one uppercase and one number',
    loginFailed: 'Login failed',
    signupFailed: 'Sign up failed',
    continueWith: 'Continue with',
    or: 'or',
    
    // Pages
    myFiles: 'My files',
    upload: 'Upload',
    newFolder: 'New folder',
    folderName: 'New folder name',
    create: 'Create',
    creating: 'Creating...',
    folderNameRequired: 'The name cannot be empty',
    folderNameTooLong: 'Maximum 255 characters',
    folderNameInvalidChars: 'Invalid characters: / \\ ? * : | " < >',
    folderNameDuplicate: 'A folder with this name already exists',
    name: 'Name',
    size: 'Size',
    modified: 'Modified',
    actions: 'Actions',
    download: 'Download',
    downloadZip: 'Download (ZIP)',
    share: 'Share',
    sharedWithMe: 'Shared with me',
    rename: 'Rename',
    cannotRenameRoot: 'Cannot rename root',
    move: 'Move',
    delete: 'Delete',
    cannotDeleteRoot: 'Cannot delete root',
    cancel: 'Cancel',
    selectDestination: 'Select destination folder',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    root: 'Root',
    
    // Files page
    emptyFolder: 'Drag and drop files here or click "Upload"',
    emptyFolderDescription: 'This folder is empty. Start by adding files or creating a new folder.',
    uploadInProgress: 'Upload in progress...',
    renameItem: 'Rename',
    deleteConfirm: 'Do you really want to delete',
    deleteConfirmDetails: 'This action will send to trash.',
    deleteSuccess: 'has been deleted and sent to trash.',
    deleteError: 'Error during deletion',
    deletedOn: 'Deleted on',
    restoreSuccess: 'Restored successfully',
    restoreError: 'Error during restoration',
    emptyTrash: 'Empty trash',
    trashEmptied: 'Trash emptied successfully',
    emptyTrashError: 'Error emptying trash',
    confirmEmptyTrash: 'Are you sure you want to empty the trash? This action is irreversible.',
    trashEmpty: 'Trash is empty',
    trashEmptyDescription: 'Deleted files will appear here',
    itemsInTrash: 'item in trash',
    itemsInTrashPlural: 'items in trash',
    uploadError: 'Error during upload',
    moveError: 'Error during move',
    shareModal: 'Share',
    shareType: 'Share type:',
    publicLink: 'Public link',
    shareWithUser: 'Share with user',
    sharePassword: 'Password (optional):',
    shareExpiresAt: 'Expires on (optional):',
    generateLink: 'Generate link',
    shareLinkGenerated: 'Share link generated:',
    copyLink: 'Copy link',
    searchUser: 'Search for a user:',
    selectUser: 'Select a user',
    shareWith: 'Will share with:',
    linkCopied: 'Link copied to clipboard!',
    shareError: 'Error generating share link',
    selectUserError: 'Please select a user to share with.',
    
    // Dashboard
    storageSpace: 'Storage space',
    used: 'Used',
    available: 'Available',
    usedOf: 'used of',
    breakdownByType: 'Breakdown by type',
    images: 'Images',
    videos: 'Videos',
    documents: 'Documents',
    audio: 'Audio',
    others: 'Others',
    recentFiles: 'Recent files',
    noRecentFiles: 'No recent files',
    viewAll: 'View all',
    statistics: 'Statistics',
    totalFiles: 'Total files',
    totalFolders: 'Total folders',
    
    // Search
    searchPlaceholder: 'Search for a file or folder...',
    searchButton: 'Search',
    searching: 'Searching...',
    results: 'Results',
    noResults: 'No results found',
    startSearch: 'Start your search',
    enterSearchTerms: 'Enter keywords in the search field above',
    tryDifferentSearch: 'Try different keywords or modify the filters',
    type: 'Type',
    all: 'All',
    allTypes: 'All types',
    allFormats: 'All formats',
    folders: 'Folders',
    file: 'File',
    folder: 'Folder',
    format: 'Format',
    dateFrom: 'Start date',
    dateTo: 'End date',
    modifiedPresets: 'Modified:',
    modifiedToday: 'Today',
    modifiedThisWeek: 'This week',
    modifiedLastWeek: 'Last week',
    modifiedThisMonth: 'This month',
    modifiedLastMonth: 'Last month',
    mimeType: 'MIME type',
    startDate: 'Start date',
    endDate: 'End date',
    view: 'View',
    searchError: 'Search error',
    restore: 'Restore',

    // Settings
    accountInfo: 'Account Information',
    profile: 'Profile',
    security: 'Security',
    preferences: 'Preferences',
    interfacePreferences: 'Interface preferences',
    displayName: 'Display name',
    currentPassword: 'Current password',
    newPassword: 'New password',
    changePassword: 'Change password',
    language: 'Language',
    languageLabel: 'Language / Langue',
    theme: 'Theme',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    savePreferences: 'Save preferences',
    notifications: 'Enable notifications',
    spaceUsed: 'Space used',
    accountCreated: 'Account created on',
    lastLogin: 'Last login',
    never: 'Never',
    saveChanges: 'Save changes',
    saving: 'Saving...',
    preferencesUpdated: 'Preferences updated',
    passwordChanged: 'Password changed successfully',
    profileUpdated: 'Profile updated successfully',
    uploadAvatar: 'Change avatar',
    yourName: 'Your name',
    
    // Messages
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    yes: 'Yes',
    no: 'No',
    mustBeConnected: 'You must be logged in to download',
    downloadError: 'Error during download',
    renameError: 'Error during rename',
    createFolderError: 'Error creating folder',
    loadError: 'Error loading',
    errorSessionExpired: 'Your session has expired. Please log in again.',
    errorAccessDenied: 'Access denied. You do not have the necessary permissions.',
    errorFolderNotFound: 'Folder not found.',
    errorRateLimit: 'Too many requests. Please wait a moment.',
    errorServer: 'Server error. Please try again later.',
    errorNetwork: 'Unable to connect to server. Check your internet connection.',
    retry: 'Retry',
    errorLoadingDashboard: 'Unable to load dashboard.',
    offlineNoCache: 'Offline and no cached data.',
    selectAll: 'Select all',
  }
};

// Fonction pour obtenir la langue actuelle
export const getCurrentLanguage = () => {
  return localStorage.getItem('language') || 'fr';
};

// Fonction pour définir la langue
export const setLanguage = (lang) => {
  if (lang === 'fr' || lang === 'en') {
    localStorage.setItem('language', lang);
    document.documentElement.setAttribute('lang', lang);
  }
};

// Fonction de traduction
export const t = (key, lang = null) => {
  const currentLang = lang || getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[currentLang] || translations.fr;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback vers le français si la traduction n'existe pas
      value = translations.fr;
      for (const k2 of keys) {
        value = value?.[k2];
      }
      break;
    }
  }
  
  return value !== undefined ? value : key;
};

// Hook React pour les traductions
export const useTranslation = () => {
  const [lang, setLangState] = React.useState(getCurrentLanguage());
  
  React.useEffect(() => {
    const handleStorageChange = () => {
      setLangState(getCurrentLanguage());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return {
    t: (key) => t(key, lang),
    language: lang,
    setLanguage: (newLang) => {
      setLanguage(newLang);
      setLangState(newLang);
    }
  };
};

export default { t, getCurrentLanguage, setLanguage, useTranslation };
