import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shareService } from '../services/api';
import { useToast } from '../components/Toast';
import { API_URL } from '../config';
import { downloadBlob } from '../utils/downloadBlob';

const DOWNLOAD_TIMEOUT_MS = 120000; // 2 min (pro) pour dossiers / gros fichiers

function sanitizeDownloadFilename(name, fallback = 'download') {
  if (name == null || typeof name !== 'string') return fallback;
  const sanitized = String(name).replace(/[/\\:*?"<>|]/g, '').trim();
  if (sanitized.length === 0) return fallback;
  return sanitized.length > 200 ? sanitized.slice(0, 200) : sanitized;
}

export default function Share() {
  const { token } = useParams();
  const toast = useToast();
  const [share, setShare] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);

  useEffect(() => {
    loadShare();
  }, [token]);

  const loadShare = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Essayer de charger le partage sans mot de passe d'abord
      const response = await shareService.getPublicShare(token);
      
      if (response.status === 200) {
        const shareData = response.data.data;
        setShare(shareData);
        // Vérifier si un mot de passe est requis
        if (shareData.share?.password_hash || shareData.share?.requires_password) {
          setPasswordRequired(true);
        }
      } else if (response.status === 401 && response.data?.requires_password) {
        setPasswordRequired(true);
      } else {
        setError(response.data?.error?.message || 'Partage non trouvé ou expiré');
      }
    } catch (err) {
      console.error('Load share error:', err);
      if (err.response?.status === 401 && err.response?.data?.requires_password) {
        setPasswordRequired(true);
      } else if (err.response?.status === 410) {
        setError('Ce partage a expiré');
      } else if (err.response?.status === 403) {
        setError('Ce partage a été désactivé');
      } else if (err.response?.status === 404) {
        setError('Partage non trouvé');
      } else {
        setError(err.response?.data?.error?.message || 'Erreur lors du chargement du partage');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!share || !share.resource) return;
    
    const resource = share.resource;
    const params = new URLSearchParams();
    params.append('token', token);
    if (password && password.trim() !== '') {
      params.append('password', password);
    }
    const downloadUrl = resource.type === 'file'
      ? `${API_URL}/api/files/${resource.id}/download?${params.toString()}`
      : `${API_URL}/api/folders/${resource.id}/download?${params.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    try {
      const response = await fetch(downloadUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const ct = response.headers.get('Content-Type') || '';
        let msg = 'Erreur lors du téléchargement';
        if (ct.includes('application/json')) {
          try {
            const errorData = await response.json();
            msg = errorData.error?.code === 'FOLDER_EMPTY_OR_ORPHANED'
              ? 'Ce dossier ne contient aucun fichier accessible sur le serveur.'
              : (errorData.error?.message || msg);
          } catch (_) {}
        }
        throw new Error(msg);
      }
      const blob = await response.blob();
      const safeName = resource.type === 'folder'
        ? sanitizeDownloadFilename(resource.name, 'dossier') + '.zip'
        : sanitizeDownloadFilename(resource.name, 'download');
      downloadBlob(blob, safeName);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Download error:', err);
      const msg = err?.name === 'AbortError'
        ? 'Le téléchargement a pris trop de temps. Réessayez ou choisissez un dossier plus petit.'
        : (err.message || 'Erreur lors du téléchargement');
      toast.error(msg);
    }
  };

  const verifyPassword = async () => {
    if (!password) {
      toast.warning('Veuillez entrer le mot de passe');
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/share/${token}?password=${encodeURIComponent(password)}`);
      
      if (response.ok) {
        const data = await response.json();
        setShare(data.data);
        setPasswordRequired(false);
      } else {
        const error = await response.json();
        toast.error(error.error?.message || 'Mot de passe incorrect');
      }
    } catch (err) {
      console.error('Password verification error:', err);
      toast.error('Erreur lors de la vérification du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Chargement...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Erreur</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
        <h2>Partage protégé par mot de passe</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            style={{ padding: 8, width: '100%', marginBottom: 8 }}
            onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
          />
          <button
            onClick={verifyPassword}
            style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}
          >
            Accéder
          </button>
        </div>
      </div>
    );
  }

  if (!share || !share.resource) {
    return <div style={{ padding: 24 }}>Ressource non trouvée</div>;
  }

  const resource = share.resource;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <h1>Partage de fichier</h1>
      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16 }}>
        <h2>{resource.name}</h2>
        {resource.type === 'file' && (
          <>
            <p>Taille: {formatBytes(resource.size)}</p>
            <p>Type: {resource.mime_type}</p>
          </>
        )}
        <button
          onClick={handleDownload}
          style={{ padding: '12px 24px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
        >
          {resource.type === 'folder' ? 'Télécharger le dossier (ZIP)' : 'Télécharger le fichier'}
        </button>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

