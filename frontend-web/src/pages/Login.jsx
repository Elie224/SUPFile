import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { authService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [searchParams] = useSearchParams();
  
  // 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId2FA, setUserId2FA] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Message de succès après vérification email
  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      setSuccessMessage(t('emailVerifiedSuccess') || 'Email vérifié. Vous pouvez vous connecter.');
      setError('');
    }
  }, [searchParams, t]);

  // Vérifier les erreurs OAuth dans l'URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    if (errorParam) {
      let errorMessage = '';
      
      if (errorParam === 'oauth_not_configured') {
        errorMessage = messageParam 
          ? decodeURIComponent(messageParam)
          : (language === 'en' ? 'OAuth is not configured. Please contact the administrator.' : 'OAuth n\'est pas configuré. Veuillez contacter l\'administrateur.');
      } else if (errorParam === 'oauth_init_failed') {
        errorMessage = messageParam 
          ? decodeURIComponent(messageParam)
          : (language === 'en' ? 'Failed to initiate OAuth authentication.' : 'Échec de l\'initialisation de l\'authentification OAuth.');
      } else if (errorParam === 'oauth_failed' || errorParam === 'oauth_callback_failed' || errorParam === 'no_tokens') {
        errorMessage = messageParam 
          ? decodeURIComponent(messageParam)
          : (language === 'en' ? 'OAuth authentication failed. Please try again.' : 'L\'authentification OAuth a échoué. Veuillez réessayer.');
      }
      
      if (errorMessage) {
        setError(errorMessage);
      }
    }
  }, [searchParams, language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setEmailNotVerified(false);
    setLoading(true);

    // Validation basique
    if (!email || !password) {
      setError(t('fillAllFields'));
      setLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else if (result.requires_2fa) {
      setRequires2FA(true);
      setUserId2FA(result.user_id);
      setError('');
      setEmailNotVerified(false);
    } else {
      setError(result.error || t('loginFailed'));
      setEmailNotVerified(!!result.emailNotVerified);
    }
    
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!email?.trim()) return;
    setResendLoading(true);
    setError('');
    try {
      await authService.resendVerification(email.trim());
      setSuccessMessage(t('resendVerificationSent') || 'Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception.');
      setEmailNotVerified(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Erreur lors de l\'envoi.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!twoFactorCode) {
      setError('Veuillez entrer le code de vérification');
      setLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
      const response = await fetch(`${API_URL}/api/auth/verify-2fa-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId2FA,
          token: twoFactorCode
        })
      });

      const data = await response.json();

      if (data.data && data.data.access_token) {
        // Stocker les tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        
        // Mettre à jour le store
        const { setUser } = useAuthStore.getState();
        setUser(data.data.user);
        
        navigate('/dashboard');
      } else {
        setError(data.error?.message || 'Code 2FA invalide');
      }
    } catch (err) {
      setError('Erreur lors de la vérification du code 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-background">
      <div className="auth-card-container">
        <div className="card auth-card shadow-lg fade-in" style={{ width: '100%', maxWidth: '380px', border: 'none', borderRadius: '12px' }}>
          <div className="card-body p-3">
          {/* Logo / Titre */}
          <div className="text-center mb-2">
            <Logo size="medium" style={{ marginBottom: '4px', maxWidth: '50px' }} />
            <h1 className="h5 mb-0" style={{ fontWeight: 700, color: 'var(--text-color)' }}>
              SUPFile
            </h1>
            <p className="text-muted mb-0" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t('login')}</p>
          </div>

          {/* Message de succès (ex. après vérification email) */}
          {successMessage && (
            <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-2" role="alert" style={{ fontSize: '13px' }}>
              <i className="bi bi-check-circle-fill"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger py-2 mb-2" role="alert" style={{ fontSize: '13px' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
              {emailNotVerified && email?.trim() && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="btn btn-outline-light btn-sm mt-2"
                  style={{ fontSize: '12px' }}
                >
                  {resendLoading ? (t('sending') || 'Envoi...') : (t('resendVerification') || 'Renvoyer l\'email de vérification')}
                </button>
              )}
            </div>
          )}

          {/* Vérification 2FA */}
          {requires2FA ? (
            <div>
              <div className="text-center mb-3">
                <i className="bi bi-shield-lock" style={{ fontSize: '48px', color: 'var(--primary-color)' }}></i>
                <h2 className="h6 mt-2 mb-1" style={{ color: 'var(--text-color)' }}>Vérification en deux étapes</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Entrez le code à 6 chiffres de votre application d'authentification
                </p>
              </div>

              <form onSubmit={handleVerify2FA}>
                <div className="mb-3">
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength="6"
                    autoFocus
                    style={{
                      padding: 12,
                      width: '100%',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      fontSize: '1.5em',
                      textAlign: 'center',
                      letterSpacing: '0.5em',
                      fontFamily: 'monospace',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)'
                    }}
                    required
                  />
                  <small style={{ display: 'block', marginTop: 8, fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Vous pouvez aussi utiliser un code de secours
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-2"
                  disabled={loading || twoFactorCode.length < 6}
                  style={{ minHeight: '40px', fontSize: '14px', fontWeight: 600 }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Vérification...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Vérifier
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode('');
                    setUserId2FA('');
                  }}
                  className="btn btn-outline-secondary w-100"
                  style={{ minHeight: '40px', fontSize: '14px' }}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Formulaire de connexion */}
              <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label htmlFor="email" className="form-label small mb-1">{t('email')}</label>
              <input
                type="email"
                id="email"
                className="form-control form-control-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="exemple@email.com"
                autoComplete="email"
              />
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="form-label small mb-1">{t('password')}</label>
              <input
                type="password"
                id="password"
                className="form-control form-control-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Lien mot de passe oublié */}
            <div className="mb-2 text-end">
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: 'var(--primary-color)', 
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-2"
              disabled={loading}
              style={{ minHeight: '40px', fontSize: '14px', fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {t('loginLoading')}
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  {t('loginButton')}
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="d-flex align-items-center my-2">
            <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span className="px-2 text-muted" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{t('or')}</span>
            <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          {/* Boutons OAuth */}
          <div className="d-flex flex-column gap-1 mb-2">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
                window.location.href = `${apiUrl}/api/auth/google`;
              }}
              className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ 
                border: '1px solid #E0E6ED',
                minHeight: '36px',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#4285f4';
                e.target.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#E0E6ED';
                e.target.style.boxShadow = 'none';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{t('continueWith')} Google</span>
            </button>
            
            {/* GitHub OAuth */}
            <button
              type="button"
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
                window.location.href = `${apiUrl}/api/auth/github`;
              }}
              className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ 
                minHeight: '36px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: '#000000',
                borderColor: '#000000'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>{t('continueWith')} GitHub</span>
            </button>
          </div>

          {/* Liens bas de page */}
          <div className="text-center mt-2">
            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
              {t('noAccount')}{' '}
              <Link to="/signup" className="text-primary text-decoration-none fw-semibold">
                {t('signupLink')}
              </Link>
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-link p-0 mt-1"
              style={{ fontSize: '11px' }}
            >
              ← Retour à la présentation
            </button>
          </div>
          </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
