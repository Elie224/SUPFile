import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import Logo from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';

const FALLBACK = {
  verifyEmailTitle: "Vérification de l'email",
  verifyEmailLoading: 'Vérification en cours...',
  verifyEmailMissingToken: 'Lien invalide : token manquant.',
  verifyEmailSuccess: 'Email vérifié. Vous pouvez maintenant vous connecter.',
  verifyEmailRedirect: 'Redirection vers la connexion...',
  verifyEmailError: 'Lien expiré ou invalide.',
  goToLogin: 'Aller à la connexion',
  verifyEmailResendHint: 'Vous pouvez demander un nouvel email de vérification depuis la page de connexion.',
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t: tContext } = useLanguage();
  const t = (key) => (tContext && tContext(key)) || FALLBACK[key] || key;
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage(FALLBACK.verifyEmailMissingToken);
      return;
    }

    let cancelled = false;
    authService.verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(res.data?.message || FALLBACK.verifyEmailSuccess);
        setTimeout(() => {
          navigate('/login?verified=1', { replace: true });
        }, 2500);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        const msg = err.response?.data?.error?.message || err.message || FALLBACK.verifyEmailError;
        setMessage(msg);
      });

    return () => { cancelled = true; };
  }, [searchParams, navigate]);

  // Styles inline de secours pour que la page soit toujours visible (thème clair/sombre)
  const bgStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };
  const cardStyle = {
    width: '100%',
    maxWidth: '380px',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    color: '#0f172a',
  };

  return (
    <div style={bgStyle} className="auth-page-background">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }} className="auth-card-container">
        <div style={cardStyle} className="card auth-card shadow-lg">
          <div className="card-body p-4 text-center" style={{ color: '#0f172a' }}>
            <Logo size="medium" style={{ marginBottom: '12px', maxWidth: '50px' }} />
            <h1 className="h5 mb-3" style={{ fontWeight: 700, color: '#0f172a' }}>
              {t('verifyEmailTitle')}
            </h1>

            {status === 'loading' && (
              <>
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
                <p className="mb-0" style={{ fontSize: '14px', color: '#475569' }}>
                  {t('verifyEmailLoading')}
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-success mb-3" style={{ fontSize: '48px' }}>
                  <i className="bi bi-check-circle-fill" />
                </div>
                <p className="text-success mb-3" style={{ fontSize: '14px' }}>{message}</p>
                <p className="small mb-0" style={{ color: '#64748b' }}>
                  {t('verifyEmailRedirect')}
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-danger mb-3" style={{ fontSize: '48px' }}>
                  <i className="bi bi-exclamation-circle-fill" />
                </div>
                <p className="text-danger mb-3" style={{ fontSize: '14px' }}>{message}</p>
                <Link to="/login" className="btn btn-primary">
                  {t('goToLogin')}
                </Link>
                <p className="mt-3 small mb-0" style={{ color: '#64748b' }}>
                  {t('verifyEmailResendHint')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
