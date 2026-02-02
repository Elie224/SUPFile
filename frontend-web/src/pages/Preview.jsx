import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';
import { downloadBlob } from '../utils/downloadBlob';
import { formatBytes } from '../utils/storageUtils';
import { fileService } from '../services/api';

export default function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]); // images dans le même dossier
  const [currentIndex, setCurrentIndex] = useState(0); // index de l'image actuelle dans la galerie
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('access_token'));

  useEffect(() => {
    loadFile();
  }, [id]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // D'abord récupérer les infos du fichier pour connaître son type MIME
      const apiUrl = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
      
      // Récupérer la liste (peut déclencher un refresh token via axios si besoin)
      let allItems = [];
      try {
        const listResponse = await fileService.list(null);
        allItems = listResponse.data?.data?.items || [];
      } catch (listErr) {
        // Ne pas bloquer si la liste échoue, on tentera le GET /files/:id
      }

      const fileInfo = allItems.find(f => f.id === id || f._id === id);
      
      if (!fileInfo) {
        // Essayer de récupérer les métadonnées directement via GET /api/files/:id
        const directResponse = await fileService.get(id);
        const fileMeta = directResponse.data?.data;
        if (!fileMeta) {
          throw new Error('Fichier non trouvé');
        }
        const mimeType = fileMeta.mime_type || '';
        const previewUrl = `${apiUrl}/api/files/${id}/preview`;
        const streamUrl = `${apiUrl}/api/files/${id}/stream`;
        
        setFile({ 
          previewUrl, 
          streamUrl, 
          contentType: mimeType, 
          name: fileMeta.name || 'Fichier', 
          size: fileMeta.size,
          folder_id: fileMeta.folder_id,
          updated_at: fileMeta.updated_at,
        });
        
        // Déterminer le type de prévisualisation
        if (mimeType.startsWith('image/')) {
          setPreviewType('image');
        } else if (mimeType === 'application/pdf') {
          setPreviewType('pdf');
        } else if (mimeType.startsWith('text/') || mimeType.includes('markdown')) {
          setPreviewType('text');
        } else if (mimeType.startsWith('video/')) {
          setPreviewType('video');
        } else if (mimeType.startsWith('audio/')) {
          setPreviewType('audio');
        } else {
          setPreviewType('download');
        }
      } else {
        const mimeType = fileInfo.mime_type || '';
        const previewUrl = `${apiUrl}/api/files/${id}/preview`;
        const streamUrl = `${apiUrl}/api/files/${id}/stream`;
        
        setFile({ 
          previewUrl, 
          streamUrl, 
          contentType: mimeType, 
          name: fileInfo.name, 
          size: fileInfo.size,
          folder_id: fileInfo.folder_id,
          updated_at: fileInfo.updated_at,
        });
        
        // Déterminer le type de prévisualisation basé sur le MIME type
        if (mimeType.startsWith('image/')) {
          setPreviewType('image');

          // Construire une galerie d'images pour le même dossier
          const currentFolderId = fileInfo.folder_id;
          const imagesInFolder = allItems.filter(
            (f) =>
              (f.mime_type || '').startsWith('image/') &&
              String(f.folder_id) === String(currentFolderId)
          );

          if (imagesInFolder.length > 0) {
            const gallery = imagesInFolder.map((img) => ({
              id: img.id || img._id,
              name: img.name,
              mime_type: img.mime_type,
            }));
            setGalleryImages(gallery);

            const index = gallery.findIndex(
              (img) => String(img.id) === String(fileInfo.id || fileInfo._id)
            );
            setCurrentIndex(index >= 0 ? index : 0);
          } else {
            setGalleryImages([]);
            setCurrentIndex(0);
          }
        } else if (mimeType === 'application/pdf') {
          setPreviewType('pdf');
          setGalleryImages([]);
        } else if (mimeType.startsWith('text/') || mimeType.includes('markdown')) {
          setPreviewType('text');
          setGalleryImages([]);
        } else if (mimeType.startsWith('video/')) {
          setPreviewType('video');
          setGalleryImages([]);
        } else if (mimeType.startsWith('audio/')) {
          setPreviewType('audio');
          setGalleryImages([]);
        } else {
          setPreviewType('download');
          setGalleryImages([]);
        }
      }
      setAuthToken(localStorage.getItem('access_token'));
    } catch (err) {
      console.error('Failed to load file:', err);
      setError('Impossible de charger le fichier: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const apiUrlForDownload = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
  const handleDownload = async () => {
    if (!id) return;
    const t = localStorage.getItem('access_token');
    if (!t) {
      window.location.href = '/login';
      return;
    }
    try {
      const response = await fileService.downloadBlob(id);
      const disposition = response.headers?.['content-disposition'];
      const match = disposition && disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1].trim() : (file?.name || 'download');
      downloadBlob(response.data, filename);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback direct pour éviter les erreurs CORS / ERR_FAILED
      if (t) {
        window.location.href = `${apiUrlForDownload}/api/files/${id}/download?access_token=${encodeURIComponent(t)}`;
        return;
      }
      alert(err.message || 'Erreur lors du téléchargement');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Erreur</h2>
        <p>{error}</p>
        <button
          type="button"
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Télécharger le fichier
        </button>
      </div>
    );
  }

  const apiUrl = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
  const token = authToken;

  const hasGallery = previewType === 'image' && galleryImages.length > 1;
  const currentImage = hasGallery ? galleryImages[currentIndex] : null;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            aria-label="Retour"
            title="Retour"
          >
            <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>
            Retour
          </button>
          <h1 style={{ margin: 0 }}>Prévisualisation</h1>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Télécharger
        </button>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
        {previewType === 'image' && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            {/* Image principale */}
            <ImagePreview
              url={file.previewUrl}
              token={token}
              key={currentImage ? currentImage.id : file.previewUrl}
            />

            {/* Galerie (vignettes) si plusieurs images dans le dossier */}
            {hasGallery && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Autres images du dossier</h3>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  {galleryImages.map((img, index) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        // Mettre à jour l'URL de prévisualisation du fichier courant
                        const imgPreviewUrl = `${apiUrl}/api/files/${img.id}/preview`;
                        const imgStreamUrl = `${apiUrl}/api/files/${img.id}/stream`;
                        setFile((prev) => ({
                          ...(prev || {}),
                          previewUrl: imgPreviewUrl,
                          streamUrl: imgStreamUrl,
                          name: img.name,
                          contentType: img.mime_type,
                        }));
                      }}
                      style={{
                        borderRadius: 6,
                        padding: 4,
                        border: index === currentIndex ? '2px solid #2196F3' : '1px solid #ddd',
                        backgroundColor: index === currentIndex ? '#e3f2fd' : '#fff',
                        cursor: 'pointer',
                        minWidth: 80,
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 60,
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          borderRadius: 4,
                          marginBottom: 4,
                          fontSize: 11,
                          color: '#555',
                        }}
                      >
                        {img.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {previewType === 'pdf' && (
          <div style={{ height: '80vh' }}>
            <PdfPreview url={file.previewUrl} token={token} />
          </div>
        )}

        {previewType === 'text' && (
          <div style={{ padding: 24, backgroundColor: 'white', height: '80vh', overflow: 'auto' }}>
            <TextPreview url={`${file.previewUrl}`} token={token} />
          </div>
        )}

        {previewType === 'video' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <VideoPreview url={file.streamUrl} token={token} />
          </div>
        )}

        {previewType === 'audio' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <AudioPreview url={file.streamUrl} token={token} />
          </div>
        )}

        {previewType === 'download' && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p>Ce type de fichier ne peut pas être prévisualisé.</p>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Télécharger le fichier
            </button>
          </div>
        )}
      </div>

      {file && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
          <h3>Détails techniques</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div><strong>Nom:</strong> {file.name || 'Non spécifié'}</div>
            <div><strong>Type MIME:</strong> {file.contentType || 'Non spécifié'}</div>
            {file.size != null && <div><strong>Taille:</strong> {formatBytes(file.size)}</div>}
            {file.updated_at && (
              <div><strong>Date de modification:</strong> {new Date(file.updated_at).toLocaleString('fr-FR')}</div>
            )}
            <div><strong>ID:</strong> {id}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour prévisualiser les images avec authentification
function ImagePreview({ url, token }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Impossible de charger l\'image');
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(err.message);
      }
    };
    
    loadImage();
    
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [url, token]);

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>Erreur: {error}</div>;
  }

  if (!imageUrl) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Chargement de l'image...</div>;
  }

  return (
    <img
      src={imageUrl}
      alt="Preview"
      style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
    />
  );
}

// Composant pour prévisualiser les PDF avec authentification
function PdfPreview({ url, token }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Impossible de charger le PDF');
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(err.message);
      }
    };
    
    loadPdf();
    
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [url, token]);

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>Erreur: {error}</div>;
  }

  if (!pdfUrl) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Chargement du PDF...</div>;
  }

  return (
    <iframe
      src={pdfUrl}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title="PDF Preview"
    />
  );
}

// Composant pour prévisualiser les vidéos avec streaming HTTP natif
// Utilise ?token=xxx dans l'URL pour permettre les Range requests (lecture progressive)
function VideoPreview({ url, token }) {
  const [error, setError] = useState(null);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);

  const effectiveToken = token || localStorage.getItem('access_token');
  const streamUrl = (() => {
    if (!url || !effectiveToken) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(effectiveToken)}`;
  })();

  const tryFallback = async () => {
    if (!url || !effectiveToken) {
      setError('Impossible de charger la vidéo. Vérifiez que le fichier existe sur le serveur.');
      return;
    }
    setIsFallbackLoading(true);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${effectiveToken}` },
      });
      if (!response.ok) {
        throw new Error(`Erreur de streaming (${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setFallbackUrl(objectUrl);
      setIsFallback(true);
    } catch (err) {
      setError(err.message || 'Impossible de charger la vidéo.');
    } finally {
      setIsFallbackLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (fallbackUrl) {
        URL.revokeObjectURL(fallbackUrl);
      }
    };
  }, [fallbackUrl]);

  const handleError = (e) => {
    console.error('Video error:', e);
    if (!isFallback && !isFallbackLoading) {
      tryFallback();
      return;
    }
    setError('Impossible de charger la vidéo. Vérifiez que le fichier existe sur le serveur.');
  };

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>Erreur: {error}</div>;
  }

  if (!streamUrl) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Chargement de la vidéo...</div>;
  }

  return (
    <video
      controls
      preload="metadata"
      style={{ maxWidth: '100%', maxHeight: '80vh' }}
      src={fallbackUrl || streamUrl}
      onError={handleError}
    >
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
}

// Composant pour prévisualiser les fichiers audio avec streaming HTTP natif
function AudioPreview({ url, token }) {
  const [error, setError] = useState(null);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isFallbackLoading, setIsFallbackLoading] = useState(false);

  const effectiveToken = token || localStorage.getItem('access_token');
  const streamUrl = (() => {
    if (!url || !effectiveToken) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(effectiveToken)}`;
  })();

  const tryFallback = async () => {
    if (!url || !effectiveToken) {
      setError('Impossible de charger l\'audio. Vérifiez que le fichier existe sur le serveur.');
      return;
    }
    setIsFallbackLoading(true);
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${effectiveToken}` },
      });
      if (!response.ok) {
        throw new Error(`Erreur de streaming (${response.status})`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setFallbackUrl(objectUrl);
      setIsFallback(true);
    } catch (err) {
      setError(err.message || 'Impossible de charger l\'audio.');
    } finally {
      setIsFallbackLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (fallbackUrl) {
        URL.revokeObjectURL(fallbackUrl);
      }
    };
  }, [fallbackUrl]);

  const handleError = (e) => {
    console.error('Audio error:', e);
    if (!isFallback && !isFallbackLoading) {
      tryFallback();
      return;
    }
    setError('Impossible de charger l\'audio. Vérifiez que le fichier existe sur le serveur.');
  };

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>Erreur: {error}</div>;
  }

  if (!streamUrl) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Chargement de l'audio...</div>;
  }

  return (
    <audio controls preload="metadata" style={{ width: '100%', maxWidth: '600px' }} src={fallbackUrl || streamUrl} onError={handleError}>
      Votre navigateur ne supporte pas la lecture audio.
    </audio>
  );
}

// Composant pour prévisualiser les fichiers texte
function TextPreview({ url, token }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadText = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Impossible de charger le fichier texte');
        }
        
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Failed to load text:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadText();
  }, [url, token]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Chargement du texte...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: 'red' }}>Erreur: {error}</div>;
  }

  return (
    <pre style={{ 
      margin: 0, 
      whiteSpace: 'pre-wrap', 
      fontFamily: 'monospace', 
      fontSize: 14,
      lineHeight: 1.6,
      padding: 16,
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: 4
    }}>
      {content}
    </pre>
  );
}
