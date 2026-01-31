import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="card shadow-lg fade-in" style={{ width: '100%', maxWidth: '450px', border: 'none', borderRadius: '16px', backgroundColor: 'var(--bg-color)' }}>
        <div className="card-body p-4 p-md-5">
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
              <i className="bi bi-key-fill" style={{ fontSize: '28px', color: 'white' }}></i>
            </div>
            <h1 className="h3 mb-2" style={{ fontWeight: 700, color: 'var(--text-color)' }}>
              Mot de passe oublié ?
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

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
              <h2 className="h5 mb-3" style={{ color: 'var(--text-color)' }}>Email envoyé !</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                Vérifiez également votre dossier spam.
              </p>
              <Link to="/login" className="btn btn-primary w-100" style={{ minHeight: '48px' }}>
                <i className="bi bi-arrow-left me-2"></i>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {/* Message d'erreur */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label" style={{ color: 'var(--text-color)' }}>
                    <i className="bi bi-envelope me-2"></i>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-control form-control-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="exemple@email.com"
                    autoComplete="email"
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
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      Envoyer le lien
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
