import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import Logo from '../components/Logo';
import { COUNTRIES } from '../utils/countries';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  
  const { signup, resendVerificationEmail } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return t('passwordMinLength');
    if (!/[A-Z]/.test(pwd)) return t('passwordRequiresUppercase');
    if (!/[0-9]/.test(pwd)) return t('passwordRequiresNumber');
    return null;
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendSuccess('');
    setError('');
    
    const result = await resendVerificationEmail(email);
    
    if (result.success) {
      setResendSuccess('Email de vérification renvoyé ! Vérifiez votre boîte mail.');
    } else {
      setError(result.error || 'Erreur lors de l\'envoi de l\'email');
    }
    
    setResendLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!firstName?.trim() || !lastName?.trim() || !country || !email || !password || !confirmPassword) {
      setError(t('fillAllFields') || 'Veuillez remplir tous les champs.');
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

    try {
      const result = await signup(email, password, firstName.trim(), lastName.trim(), country);

      if (result.success) {
        if (result.requiresVerification) {
          setSuccessMessage(t('signupVerifyEmail') || 'Compte créé. Un email de vérification a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte, puis connectez-vous.');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || t('signupFailed'));
        if (result.emailAlreadyUsed) {
          setSuccessMessage('');
        }
      }
    } catch (err) {
      setError(t('signupFailed') || 'L\'inscription a échoué. Vérifiez votre connexion et réessayez.');
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
            <p className="text-muted mb-0" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t('signup')}</p>
          </div>

          {/* Message de succès : informer qu'il faut valider l'email avant de se connecter */}
          {successMessage && (
            <div className="mb-3 p-3 rounded signup-success-box">
              <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success-color)' }}>
                <i className="bi bi-envelope-check-fill" />
                <span>Compte créé</span>
              </div>
              <p className="mb-1 small" style={{ color: 'var(--text-color)', lineHeight: 1.5 }}>
                Vous devez <strong>valider votre adresse email</strong> avant de pouvoir vous connecter.
              </p>
              <p className="mb-2 small" style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
                Un email vous a été envoyé avec un lien — cliquez dessus pour activer votre compte, puis connectez-vous. Le lien expire dans 15 minutes.
              </p>
              <Link to="/login" className="btn btn-sm btn-outline-primary mt-2" style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
                {t('goToLogin') || 'Aller à la connexion'}
              </Link>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger py-3 mb-2" role="alert" style={{ fontSize: '13px' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span style={{ color: '#fff', fontWeight: 600 }}>{error}</span>
              </div>
              {(error.includes('déjà') || error.includes('already')) && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.4)' }}>
                  <p className="mb-3" style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6', fontWeight: 500 }}>
                    Cet email est déjà utilisé. Si vous n&apos;avez pas vérifié votre compte, cliquez sur le bouton ci-dessous pour renvoyer l&apos;email de vérification.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="btn btn-light w-100 mb-2"
                    style={{ fontWeight: 600, fontSize: '14px', padding: '10px' }}
                  >
                    {resendLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope-fill me-2"></i>
                        Renvoyer l&apos;email de vérification
                      </>
                    )}
                  </button>
                  <Link to="/login" className="btn btn-sm btn-outline-light w-100" style={{ fontWeight: 600 }}>
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    {t('goToLogin') || 'Aller à la connexion'}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Message de succès du renvoi */}
          {resendSuccess && (
            <div className="alert alert-success py-2 mb-2" role="alert" style={{ fontSize: '13px' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill"></i>
                <span style={{ fontWeight: 600 }}>{resendSuccess}</span>
              </div>
            </div>
          )}

          {/* Formulaire d'inscription */}
          {!successMessage && (
          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label htmlFor="firstName" className="form-label small mb-1">{t('firstName') || 'Prénom'}</label>
              <input
                type="text"
                id="firstName"
                className="form-control form-control-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
                placeholder="Jean"
                autoComplete="given-name"
              />
            </div>
            <div className="mb-2">
              <label htmlFor="lastName" className="form-label small mb-1">{t('lastName') || 'Nom'}</label>
              <input
                type="text"
                id="lastName"
                className="form-control form-control-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
                placeholder="Dupont"
                autoComplete="family-name"
              />
            </div>
            <div className="mb-2">
              <label htmlFor="country" className="form-label small mb-1">{t('country') || 'Pays'}</label>
              <select
                id="country"
                className="form-select form-select-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">{t('selectCountry') || 'Choisir un pays'}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
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
                autoComplete="new-password"
              />
              <small className="text-muted d-block" style={{ fontSize: '10px' }}>
                Min. 8 car., 1 maj., 1 chiffre
              </small>
            </div>

            <div className="mb-2">
              <label htmlFor="confirmPassword" className="form-label small mb-1">{t('confirmPassword') || 'Confirmer'}</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control form-control-sm"
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
              className="btn btn-primary w-100 mb-2"
              disabled={loading}
              style={{ minHeight: '40px', fontSize: '14px', fontWeight: 600 }}
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
          )}

          {successMessage && (
            <div className="text-center mb-2">
              <Link to="/login" className="btn btn-primary" style={{ minHeight: '40px', fontSize: '14px', fontWeight: 600 }}>
                {t('goToLogin') || 'Aller à la connexion'}
              </Link>
            </div>
          )}

          {/* Séparateur + OAuth - masqués après succès */}
          {!successMessage && (
          <>
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
          <div className="text-center mt-2" style={{ marginTop: '0.5rem' }}>
            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
              {t('alreadyHaveAccount') || 'Déjà un compte ?'}{' '}
              <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                {t('loginLink') || 'Se connecter'}
              </Link>
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-link p-0 mt-1"
              style={{ fontSize: '11px' }}
            >
              ← Retour à la présentation de SUPFile
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
