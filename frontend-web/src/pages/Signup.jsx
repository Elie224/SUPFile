import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return t('passwordMinLength');
    if (!/[A-Z]/.test(pwd)) return t('passwordRequiresUppercase');
    if (!/[0-9]/.test(pwd)) return t('passwordRequiresNumber');
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError(t('fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    const result = await signup(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || t('signupFailed'));
    }
    
    setLoading(false);
  };

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', padding: '20px 0' }}>
      <div className="card shadow-lg fade-in" style={{ width: '100%', maxWidth: '420px', border: 'none', borderRadius: '12px', backgroundColor: 'var(--bg-color)' }}>
        <div className="card-body p-3 p-md-4">
          {/* Logo / Titre */}
          <div className="text-center mb-3">
            <Logo size="large" style={{ marginBottom: '8px', maxWidth: '80px' }} />
            <h1 className="h3 mb-1" style={{ fontWeight: 700, color: 'var(--text-color)' }}>
              SUPFile
            </h1>
            <p className="text-muted mb-0" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('signup')}</p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Formulaire d'inscription */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                <i className="bi bi-envelope me-2"></i>
                {t('email')}
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="exemple@email.com"
                autoComplete="email"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-lock-fill me-2"></i>
                {t('password')}
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <small className="text-muted d-block mt-1">
                <i className="bi bi-info-circle me-1"></i>
                {t('passwordRequirements') || 'Minimum 8 caractères, 1 majuscule, 1 chiffre'}
              </small>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                <i className="bi bi-lock-fill me-2"></i>
                {t('confirmPassword') || 'Confirmer le mot de passe'}
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
              style={{ minHeight: '48px', fontSize: '16px', fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {t('signupLoading') || 'Création du compte...'}
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill me-2"></i>
                  {t('signupButton') || 'Créer un compte'}
                </>
              )}
            </button>
          </form>

          {/* Séparateur */}
          <div className="d-flex align-items-center my-4">
            <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            <span className="px-3 text-muted small" style={{ color: 'var(--text-muted)' }}>{t('or')}</span>
            <div className="flex-grow-1" style={{ height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          </div>

          {/* Boutons OAuth */}
          <div className="d-flex flex-column gap-2 mb-3">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
                window.location.href = `${apiUrl}/api/auth/google`;
              }}
              className="btn btn-light w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ 
                border: '2px solid #E0E6ED',
                minHeight: '48px',
                fontSize: '16px',
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
              <svg width="20" height="20" viewBox="0 0 24 24">
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
                minHeight: '48px',
                fontSize: '16px',
                fontWeight: 600,
                backgroundColor: '#000000',
                borderColor: '#000000'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>{t('continueWith')} GitHub</span>
            </button>
          </div>

          {/* Liens bas de page */}
          <div className="text-center">
            <p className="text-muted mb-1">
              {t('alreadyHaveAccount') || 'Vous avez déjà un compte ?'}{' '}
              <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                {t('loginLink') || 'Se connecter'}
              </Link>
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-link p-0 mt-1"
              style={{ fontSize: '14px' }}
            >
              ← Retour à la présentation de SUPFile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
