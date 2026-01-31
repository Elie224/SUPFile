import React, { useState, useEffect } from 'react';

/**
 * Bannière affichée quand l'utilisateur est hors ligne.
 * Informe l'utilisateur et liste ce qui fonctionne ou non sans connexion.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        padding: '12px 16px',
        backgroundColor: '#f59e0b',
        color: '#1f2937',
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flexWrap: 'wrap',
        textAlign: 'center'
      }}
    >
      <span aria-hidden="true">📡</span>
      <span>
        <strong>Vous êtes hors ligne.</strong> L'application reste utilisable (navigation, paramètres). 
        Upload, téléchargement et synchronisation nécessitent une connexion.
      </span>
    </div>
  );
}
