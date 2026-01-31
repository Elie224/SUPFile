import React, { useState, useEffect } from 'react';
import syncService from '../services/syncService';
import offlineDB from '../services/offlineDB';

/**
 * Indicateur de synchronisation affiché dans l'interface.
 * Montre l'état de la sync et le nombre d'opérations en attente.
 */
export default function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Charger le nombre d'opérations en attente
  const loadPendingCount = async () => {
    try {
      const ops = await offlineDB.getPendingOperations();
      setPendingCount(ops.length);
    } catch (err) {
      console.error('[SyncIndicator] Erreur chargement opérations:', err);
    }
  };

  // Charger la date de dernière sync
  const loadLastSync = async () => {
    try {
      const date = await offlineDB.getUserMeta('lastSyncDate');
      setLastSync(date);
    } catch (err) {
      console.error('[SyncIndicator] Erreur chargement dernière sync:', err);
    }
  };

  useEffect(() => {
    loadPendingCount();
    loadLastSync();

    // Écouter les changements de connexion
    const handleOnline = () => {
      setIsOnline(true);
      // Synchroniser automatiquement quand on revient en ligne
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Écouter les événements de sync
    const unsubscribe = syncService.addSyncListener((event) => {
      if (event.type === 'sync-start') {
        setIsSyncing(true);
      } else if (event.type === 'sync-complete') {
        setIsSyncing(false);
        loadPendingCount();
        loadLastSync();
      } else if (event.type === 'sync-error') {
        setIsSyncing(false);
      }
    });

    // Rafraîchir le compteur toutes les 10 secondes
    const interval = setInterval(loadPendingCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      alert('Vous êtes hors ligne. La synchronisation nécessite une connexion Internet.');
      return;
    }

    setIsSyncing(true);
    await syncService.fullSync();
    setIsSyncing(false);
  };

  if (!isOnline && pendingCount === 0) {
    return null; // Ne rien afficher si hors ligne sans opérations en attente
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        backgroundColor: 'var(--bg-color)',
        border: `2px solid ${isOnline ? '#4CAF50' : '#f59e0b'}`,
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 320,
        cursor: pendingCount > 0 ? 'pointer' : 'default'
      }}
      onClick={pendingCount > 0 ? handleSync : undefined}
      title={pendingCount > 0 ? 'Cliquez pour synchroniser' : ''}
    >
      {/* Icône de statut */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: isSyncing ? '#2196F3' : (isOnline ? '#4CAF50' : '#f59e0b'),
          animation: isSyncing ? 'pulse 1.5s ease-in-out infinite' : 'none'
        }}
      />

      {/* Texte */}
      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-color)' }}>
        {isSyncing ? (
          <span>
            <strong>Synchronisation...</strong>
          </span>
        ) : pendingCount > 0 ? (
          <span>
            <strong>{pendingCount}</strong> opération{pendingCount > 1 ? 's' : ''} en attente
          </span>
        ) : (
          <span>
            {isOnline ? '✓ Synchronisé' : 'Hors ligne'}
          </span>
        )}
        {lastSync && !isSyncing && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Dernière sync: {new Date(lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Bouton sync manuel */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <i className="bi bi-arrow-repeat" style={{ fontSize: 18, color: 'var(--primary-color)' }}></i>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
