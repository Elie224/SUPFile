import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError('Lien de réinitialisation invalide');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify-reset-token/${token}`);
        const data = await response.json();

        if (response.ok && data.data?.valid) {
          setTokenValid(true);
          setTokenEmail(data.data.email || '');
        } else {
          setError(data.error?.message || 'Lien de réinitialisation invalide ou expiré');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
    if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[0-9]/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error?.message || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Écran de chargement
  if (verifying) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Vérification...</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="card shadow-lg fade-in" style={{ width: '100%', maxWidth: '450px', border: 'none', borderRadius: '16px', backgroundColor: 'var(--bg-color)' }}>
        <div className="card-body p-4 p-md-5">
          {success ? (
            /* Message de succès */
            <div className="text-center">
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-check-lg" style={{ fontSize: '40px', color: 'white' }}></i>
              </div>
              <h2 className="h4 mb-3" style={{ color: 'var(--text-color)' }}>Mot de passe réinitialisé !</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <Link to="/login" className="btn btn-primary w-100" style={{ minHeight: '48px', borderRadius: '10px' }}>
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Se connecter
              </Link>
            </div>
          ) : !tokenValid ? (
            /* Token invalide */
            <div className="text-center">
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <i className="bi bi-x-lg" style={{ fontSize: '40px', color: 'white' }}></i>
              </div>
              <h2 className="h4 mb-3" style={{ color: 'var(--text-color)' }}>Lien invalide</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {error || 'Ce lien de réinitialisation est invalide ou a expiré.'}
              </p>
              <Link to="/forgot-password" className="btn btn-primary w-100 mb-3" style={{ minHeight: '48px', borderRadius: '10px' }}>
                <i className="bi bi-arrow-repeat me-2"></i>
                Demander un nouveau lien
              </Link>
              <Link to="/login" className="btn btn-outline-secondary w-100" style={{ minHeight: '48px', borderRadius: '10px' }}>
                <i className="bi bi-arrow-left me-2"></i>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {/* Logo / Titre */}
              <div className="text-center mb-4">
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <i className="bi bi-shield-lock-fill" style={{ fontSize: '28px', color: 'white' }}></i>
                </div>
                <h1 className="h3 mb-2" style={{ fontWeight: 700, color: 'var(--text-color)' }}>
                  Nouveau mot de passe
                </h1>
                {tokenEmail && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Pour le compte : <strong>{tokenEmail}</strong>
                  </p>
                )}
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label" style={{ color: 'var(--text-color)' }}>
                    <i className="bi bi-lock-fill me-2"></i>
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    style={{ borderRadius: '10px' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Minimum 8 caractères, 1 majuscule, 1 chiffre
                  </small>
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label" style={{ color: 'var(--text-color)' }}>
                    <i className="bi bi-lock-fill me-2"></i>
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-control form-control-lg"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                  style={{ minHeight: '48px', fontSize: '16px', fontWeight: 600, borderRadius: '10px' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Modification en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Réinitialiser le mot de passe
                    </>
                  )}
                </button>
              </form>

              {/* Lien retour */}
              <div className="text-center mt-4">
                <Link 
                  to="/login" 
                  style={{ 
                    color: 'var(--text-secondary)', 
                    textDecoration: 'none',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="bi bi-arrow-left"></i>
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
