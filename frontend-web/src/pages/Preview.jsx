import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fileService } from '../services/api';

export default function Preview() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewType, setPreviewType] = useState(null);

  useEffect(() => {
    loadFile();
  }, [id]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // D'abord récupérer les infos du fichier pour connaître son type MIME
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('access_token');
      
      // Récupérer les détails du fichier
      const fileInfoResponse = await fetch(`${apiUrl}/api/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!fileInfoResponse.ok) {
        throw new Error('Impossible de récupérer les informations du fichier');
      }
      
      const fileListData = await fileInfoResponse.json();
      const fileInfo = fileListData.data?.items?.find(f => f.id === id || f._id === id);
      
      if (!fileInfo) {
        // Essayer de récupérer directement via l'ID
        const directResponse = await fetch(`${apiUrl}/api/files/${id}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!directResponse.ok) {
          throw new Error('Fichier non trouvé');
        }
        
        const contentType = directResponse.headers.get('content-type') || '';
        const previewUrl = `${apiUrl}/api/files/${id}/preview`;
        const streamUrl = `${apiUrl}/api/files/${id}/stream`;
        
        setFile({ previewUrl, streamUrl, contentType, name: 'Fichier', size: null });
        
        // Déterminer le type de prévisualisation
        if (contentType.startsWith('image/')) {
          setPreviewType('image');
        } else if (contentType === 'application/pdf') {
          setPreviewType('pdf');
        } else if (contentType.startsWith('text/') || contentType.includes('markdown')) {
          setPreviewType('text');
        } else if (contentType.startsWith('video/')) {
          setPreviewType('video');
        } else if (contentType.startsWith('audio/')) {
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
          size: fileInfo.size 
        });
        
        // Déterminer le type de prévisualisation basé sur le MIME type
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
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      setError('Impossible de charger le fichier: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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
        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/files/${id}/download`} download>
          Télécharger le fichier
        </a>
      </div>
    );
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const downloadUrl = `${apiUrl}/api/files/${id}/download`;
  const token = localStorage.getItem('access_token');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Prévisualisation</h1>
        <a
          href={downloadUrl}
          download
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 4,
          }}
        >
          Télécharger
        </a>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
        {previewType === 'image' && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <img
              src={`${file.previewUrl}?token=${token}`}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
        )}

        {previewType === 'pdf' && (
          <div style={{ height: '80vh' }}>
            <iframe
              src={`${file.previewUrl}?token=${token}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Preview"
            />
          </div>
        )}

        {previewType === 'text' && (
          <div style={{ padding: 24, backgroundColor: 'white', height: '80vh', overflow: 'auto' }}>
            <TextPreview url={`${file.previewUrl}`} token={token} />
          </div>
        )}

        {previewType === 'video' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <video
              controls
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
              src={`${file.streamUrl}?token=${token}`}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        )}

        {previewType === 'audio' && (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <audio controls style={{ width: '100%', maxWidth: '600px' }} src={`${file.streamUrl}?token=${token}`}>
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        )}

        {previewType === 'download' && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p>Ce type de fichier ne peut pas être prévisualisé.</p>
            <a
              href={downloadUrl}
              download
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 4,
                display: 'inline-block',
              }}
            >
              Télécharger le fichier
            </a>
          </div>
        )}
      </div>

      {file && (
        <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
          <h3>Détails techniques</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div><strong>Nom:</strong> {file.name || 'Non spécifié'}</div>
            <div><strong>Type MIME:</strong> {file.contentType || 'Non spécifié'}</div>
            {file.size && <div><strong>Taille:</strong> {formatBytes(file.size)}</div>}
            <div><strong>ID:</strong> {id}</div>
          </div>
        </div>
      )}
    </div>
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
