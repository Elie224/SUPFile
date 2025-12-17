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
    name: 'Nom',
    size: 'Taille',
    modified: 'Modifié',
    actions: 'Actions',
    download: 'Télécharger',
    downloadZip: 'Télécharger (ZIP)',
    share: 'Partager',
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
    uploadInProgress: 'Upload en cours...',
    renameItem: 'Renommer',
    deleteConfirm: 'Voulez-vous vraiment supprimer',
    deleteConfirmDetails: 'Cette action enverra dans la corbeille.',
    deleteSuccess: 'a été supprimé et envoyé dans la corbeille.',
    deleteError: 'Erreur lors de la suppression',
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
    statistics: 'Statistiques',
    totalFiles: 'Total fichiers',
    totalFolders: 'Total dossiers',
    
    // Search
    searchPlaceholder: 'Rechercher un fichier ou dossier...',
    searchButton: 'Rechercher',
    searching: 'Recherche en cours...',
    results: 'Résultats',
    noResults: 'Aucun résultat trouvé',
    type: 'Type',
    all: 'Tous',
    file: 'Fichier',
    folder: 'Dossier',
    mimeType: 'Type MIME',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    
    // Trash
    trashEmpty: 'La corbeille est vide',
    itemsInTrash: 'élément dans la corbeille',
    itemsInTrashPlural: 'éléments dans la corbeille',
    deletedOn: 'Supprimé le',
    restore: 'Restaurer',
    restoreSuccess: 'restauré avec succès',
    restoreError: 'Erreur lors de la restauration',
    
    // Settings
    accountInfo: 'Informations du compte',
    profile: 'Profil',
    security: 'Sécurité',
    preferences: 'Préférences',
    displayName: 'Nom d\'affichage',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    changePassword: 'Changer le mot de passe',
    language: 'Langue',
    languageLabel: 'Langue / Language',
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
    name: 'Name',
    size: 'Size',
    modified: 'Modified',
    actions: 'Actions',
    download: 'Download',
    downloadZip: 'Download (ZIP)',
    share: 'Share',
    rename: 'Rename',
    move: 'Move',
    delete: 'Delete',
    cancel: 'Cancel',
    selectDestination: 'Select destination folder',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    root: 'Root',
    
    // Files page
    emptyFolder: 'Drag and drop files here or click "Upload"',
    uploadInProgress: 'Upload in progress...',
    renameItem: 'Rename',
    deleteConfirm: 'Do you really want to delete',
    deleteConfirmDetails: 'This action will send to trash.',
    deleteSuccess: 'has been deleted and sent to trash.',
    deleteError: 'Error during deletion',
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
    statistics: 'Statistics',
    totalFiles: 'Total files',
    totalFolders: 'Total folders',
    
    // Search
    searchPlaceholder: 'Search for a file or folder...',
    searchButton: 'Search',
    searching: 'Searching...',
    results: 'Results',
    noResults: 'No results found',
    type: 'Type',
    all: 'All',
    file: 'File',
    folder: 'Folder',
    mimeType: 'MIME type',
    startDate: 'Start date',
    endDate: 'End date',
    
    // Trash
    trashEmpty: 'Trash is empty',
    itemsInTrash: 'item in trash',
    itemsInTrashPlural: 'items in trash',
    deletedOn: 'Deleted on',
    restore: 'Restore',
    restoreSuccess: 'restored successfully',
    restoreError: 'Error during restoration',
    
    // Settings
    accountInfo: 'Account Information',
    profile: 'Profile',
    security: 'Security',
    preferences: 'Preferences',
    displayName: 'Display name',
    currentPassword: 'Current password',
    newPassword: 'New password',
    changePassword: 'Change password',
    language: 'Language',
    languageLabel: 'Language / Langue',
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
