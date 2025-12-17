import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setLanguage as setLangStorage, getCurrentLanguage, t as translate } from '../utils/i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getCurrentLanguage());
  const [updateKey, setUpdateKey] = useState(0); // Clé pour forcer le re-render

  useEffect(() => {
    // Appliquer la langue au chargement
    setLangStorage(language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);
  
  useEffect(() => {
    // Écouter les changements dans localStorage (pour synchroniser entre onglets)
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue && (e.newValue === 'fr' || e.newValue === 'en')) {
        setLanguageState(e.newValue);
        document.documentElement.setAttribute('lang', e.newValue);
        setUpdateKey(prev => prev + 1); // Force le re-render
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les changements personnalisés (pour le même onglet)
    const handleLanguageChange = (e) => {
      if (e.detail && (e.detail === 'fr' || e.detail === 'en')) {
        setLanguageState(e.detail);
        setLangStorage(e.detail);
        document.documentElement.setAttribute('lang', e.detail);
        setUpdateKey(prev => prev + 1); // Force le re-render
      }
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const setLanguage = useCallback((lang) => {
    if (lang === 'fr' || lang === 'en') {
      setLanguageState(lang);
      setLangStorage(lang);
      document.documentElement.setAttribute('lang', lang);
      setUpdateKey(prev => prev + 1); // Force le re-render
      
      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }
  }, []);

  const t = useCallback((key) => {
    // Utiliser la langue du contexte React (qui est toujours à jour)
    return translate(key, language);
  }, [language, updateKey]); // Dépendre de language et updateKey pour forcer la mise à jour

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, updateKey }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

