import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function OAuthProxy({ provider }) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Récupérer tous les paramètres de l'URL
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Rediriger vers le backend avec tous les paramètres
    const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
    const backendCallbackUrl = `${apiUrl}/api/auth/${provider}/callback?${params.toString()}`;
    
    // Redirection immédiate vers le backend
    window.location.href = backendCallbackUrl;
  }, [searchParams, provider]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>Redirection...</h2>
        <p>Veuillez patienter pendant que nous vous redirigeons.</p>
      </div>
    </div>
  );
}





