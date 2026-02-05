import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { shareService } from '../services/api';
import { useToast } from '../components/Toast';
import { API_URL } from '../config';
import { formatBytes } from '../utils/storageUtils';

function sanitizeDownloadFilename(name, fallback = 'download') {
  if (name == null || typeof name !== 'string') return fallback;
  const sanitized = String(name).replace(/[/\\:*?"<>|]/g, '').trim();
  return sanitized.length === 0 ? fallback : (sanitized.length > 200 ? sanitized.slice(0, 200) : sanitized);
}

export default function Share() {
  const { token } = useParams();
  const toast = useToast();
  const [share, setShare] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const pdfFrameRef = useRef(null);
  const videoRef = useRef(null);

  const resource = share?.resource;
  const filePreviewParams = useMemo(() => {
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (password && password.trim() !== '') params.set('password', password.trim());
    return params.toString();
  }, [token, password]);

  const buildPublicUrl = (basePath) => {
    const qs = filePreviewParams;
    return qs ? `${API_URL}${basePath}?${qs}` : `${API_URL}${basePath}`;
  };

  const openFullscreenOrTab = async (url, element) => {
    try {
      if (element) {
        if (typeof element.requestFullscreen === 'function') {
          await element.requestFullscreen();
          return;
        }
        // iOS Safari vidéo
        if (typeof element.webkitEnterFullscreen === 'function') {
          element.webkitEnterFullscreen();
          return;
        }
      }
    } catch (_) {
      // fallback ci-dessous
    }
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (_) {
      window.location.href = url;
    }
  };

  const previewType = useMemo(() => {
    const mime = (resource?.mime_type || '').toLowerCase();
    if (!mime) return null;
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (
      mime.startsWith('text/') ||
      mime.includes('markdown') ||
      mime === 'application/json' ||
      mime.endsWith('+json') ||
      mime === 'application/xml' ||
      mime.endsWith('+xml') ||
      mime === 'application/yaml' ||
      mime === 'application/x-yaml' ||
      mime === 'text/yaml' ||
      mime === 'application/javascript' ||
      mime === 'application/x-javascript'
    ) return 'text';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    return 'download';
  }, [resource?.mime_type]);

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
    if (!share || !share.resource || share.resource.type !== 'file') return;
    const resource = share.resource;
    const params = new URLSearchParams();
    params.append('token', token);
    if (password && password.trim() !== '') {
      params.append('password', password);
    }
    const downloadUrl = `${API_URL}/api/files/${resource.id}/download?${params.toString()}`;
    try {
      // IMPORTANT:
      // Ne pas charger le fichier en mémoire via fetch()+blob() :
      // - casse sur fichiers/ZIP volumineux
      // - peut être tué par des timeouts/proxy
      // On délègue au navigateur (streaming vers disque).
      const w = window.open(downloadUrl, '_blank', 'noopener');
      if (!w) {
        // Popup bloquée: fallback sur navigation directe.
        window.location.href = downloadUrl;
      }
      toast.info('Téléchargement démarré…');
    } catch (err) {
      console.error('Download error:', err);
      toast.error(err?.message || 'Erreur lors du téléchargement');
    }
  };

  const handleDownloadFolder = async () => {
    if (!share || !share.resource || share.resource.type !== 'folder') return;
    const resource = share.resource;
    const params = new URLSearchParams();
    if (password && password.trim() !== '') {
      params.append('password', password);
    }
    const downloadUrl = `${API_URL}/api/share/${encodeURIComponent(String(token))}/download${params.toString() ? `?${params.toString()}` : ''}`;
    try {
      // Même principe que pour les fichiers: ouvrir le lien pour streamer le ZIP.
      // (Le ZIP peut être volumineux, `blob()` fait exploser la RAM.)
      const w = window.open(downloadUrl, '_blank', 'noopener');
      if (!w) {
        window.location.href = downloadUrl;
      }
      const folderName = sanitizeDownloadFilename(resource.name, 'dossier');
      toast.info(`Génération du ZIP… (${folderName})`);
    } catch (err) {
      console.error('Folder download error:', err);
      toast.error(err?.message || 'Erreur lors du téléchargement du dossier');
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
    return (
      <div className="container-fluid p-3 p-md-4" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-3 p-md-4" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="text-center">
        <h2>Erreur</h2>
        <p>{error}</p>
        </div>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="container-fluid p-3 p-md-4" style={{ maxWidth: 480, margin: '0 auto' }}>
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
    return (
      <div className="container-fluid p-3 p-md-4" style={{ maxWidth: 720, margin: '0 auto' }}>
        Ressource non trouvée
      </div>
    );
  }

  return (
    <div className="container-fluid p-3 p-md-4" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1>Partage de fichier</h1>
      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16 }}>
        <h2>{resource.name}</h2>
        {resource.type === 'file' && (
          <>
            <p>Taille: {formatBytes(resource.size)}</p>
            <p>Type: {resource.mime_type}</p>
          </>
        )}

        {resource.type === 'file' && (
          <div style={{ marginTop: 16, background: '#fafafa', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: 12, borderBottom: '1px solid #eee', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>Prévisualisation</div>
              {(previewType === 'pdf' || previewType === 'video') && (
                <button
                  type="button"
                  onClick={() => {
                    const url = previewType === 'pdf'
                      ? buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/preview`)
                      : buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/stream`);
                    const el = previewType === 'pdf' ? pdfFrameRef.current : videoRef.current;
                    openFullscreenOrTab(url, el);
                  }}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                  title="Ouvrir en plein écran"
                >
                  Ouvrir en plein écran
                </button>
              )}
            </div>
            <div style={{ padding: 12 }}>
              {previewType === 'image' && (
                <PublicImagePreview url={buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/preview`)} />
              )}
              {previewType === 'pdf' && (
                <div style={{ height: '75vh' }}>
                  <PublicPdfPreview url={buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/preview`)} iframeRef={pdfFrameRef} />
                </div>
              )}
              {previewType === 'text' && (
                <PublicTextPreview url={buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/preview`)} />
              )}
              {previewType === 'video' && (
                <PublicVideoPreview url={buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/stream`)} videoRef={videoRef} />
              )}
              {previewType === 'audio' && (
                <PublicAudioPreview url={buildPublicUrl(`/api/files/${encodeURIComponent(String(resource.id))}/stream`)} />
              )}
              {previewType === 'download' && (
                <div style={{ color: 'var(--text-secondary)' }}>Prévisualisation non disponible pour ce type de fichier.</div>
              )}
            </div>
          </div>
        )}

        {resource.type === 'file' && (
          <button
            onClick={handleDownload}
            style={{ padding: '12px 24px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
          >
            Télécharger le fichier
          </button>
        )}
        {resource.type === 'folder' && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleDownloadFolder}
              style={{ padding: '12px 24px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
            >
              Télécharger le dossier (ZIP)
            </button>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 13 }}>
              Le dossier est téléchargé sous forme d’archive ZIP.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PublicImagePreview({ url }) {
  const [error, setError] = useState(null);
  if (error) return <div style={{ color: 'red' }}>Erreur: {error}</div>;
  return (
    <img
      src={url}
      alt="Preview"
      style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', margin: '0 auto', objectFit: 'contain' }}
      onError={() => setError('Impossible de charger l\'image')}
    />
  );
}

function PublicPdfPreview({ url, iframeRef }) {
  return (
    <iframe
      ref={iframeRef}
      src={url}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="PDF Preview"
      allow="fullscreen"
      allowFullScreen
    />
  );
}

function PublicVideoPreview({ url, videoRef }) {
  const [error, setError] = useState(null);
  if (error) return <div style={{ color: 'red' }}>Erreur: {error}</div>;
  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      style={{ width: '100%', maxHeight: '75vh' }}
      src={url}
      onError={() => setError('Impossible de charger la vidéo')}
    >
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
}

function PublicAudioPreview({ url }) {
  const [error, setError] = useState(null);
  if (error) return <div style={{ color: 'red' }}>Erreur: {error}</div>;
  return (
    <audio
      controls
      preload="metadata"
      style={{ width: '100%' }}
      src={url}
      onError={() => setError('Impossible de charger l\'audio')}
    >
      Votre navigateur ne supporte pas la lecture audio.
    </audio>
  );
}

function PublicTextPreview({ url }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);
        if (!response.ok) {
          const ct = response.headers.get('Content-Type') || '';
          let msg = `Erreur (${response.status})`;
          if (ct.includes('application/json')) {
            try {
              const data = await response.json();
              msg = data?.error?.message || msg;
            } catch (_) {}
          }
          throw new Error(msg);
        }
        const text = await response.text();
        if (!cancelled) setContent(text);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Impossible de charger le texte');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <div>Chargement du texte...</div>;
  if (error) return <div style={{ color: 'red' }}>Erreur: {error}</div>;

  return (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 14, lineHeight: 1.6 }}>
      {content}
    </pre>
  );
}
