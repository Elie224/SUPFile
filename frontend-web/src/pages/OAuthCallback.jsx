import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { t } = useLanguage();

  useEffect(() => {
    const tokensParam = searchParams.get('tokens');
    const redirectParam = searchParams.get('redirect') || '/dashboard';
    const errorParam = searchParams.get('error');

    if (errorParam) {
      navigate(`/login?error=${errorParam}`, { replace: true });
      return;
    }

    if (tokensParam) {
      try {
        const tokens = JSON.parse(decodeURIComponent(tokensParam));
        
        if (tokens.access_token && tokens.refresh_token) {
          // Stocker les tokens et mettre à jour le store
          setTokens(tokens.access_token, tokens.refresh_token);
          
          // Rediriger vers la page demandée
          navigate(redirectParam, { replace: true });
        } else {
          throw new Error('Invalid tokens');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_callback_failed', { replace: true });
      }
    } else {
      navigate('/login?error=no_tokens', { replace: true });
    }
  }, [searchParams, navigate, setTokens]);

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
        <h2>{t('language') === 'en' ? 'Connecting...' : 'Connexion en cours...'}</h2>
        <p>{t('language') === 'en' ? 'Please wait while we connect you.' : 'Veuillez patienter pendant que nous vous connectons.'}</p>
      </div>
    </div>
  );
}
