import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import Logo from '../components/Logo';
import { useLanguage } from '../contexts/LanguageContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmailMissingToken') || 'Lien invalide : token manquant.');
      return;
    }

    let cancelled = false;
    authService.verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        setStatus('success');
        setMessage(res.data?.message || t('verifyEmailSuccess') || 'Email vérifié. Vous pouvez maintenant vous connecter.');
        setTimeout(() => {
          navigate('/login?verified=1', { replace: true });
        }, 2500);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        const msg = err.response?.data?.error?.message || err.message || (t('verifyEmailError') || 'Lien expiré ou invalide.');
        setMessage(msg);
      });

    return () => { cancelled = true; };
  }, [searchParams, navigate, t]);

  return (
    <div className="auth-page-background">
      <div className="auth-card-container">
        <div className="card auth-card shadow-lg fade-in" style={{ width: '100%', maxWidth: '380px', border: 'none', borderRadius: '12px' }}>
          <div className="card-body p-4 text-center">
            <Logo size="medium" style={{ marginBottom: '12px', maxWidth: '50px' }} />
            <h1 className="h5 mb-3" style={{ fontWeight: 700, color: 'var(--text-color)' }}>
              {t('verifyEmailTitle') || 'Vérification de l\'email'}
            </h1>

            {status === 'loading' && (
              <>
                <div className="spinner-border text-primary mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }} />
                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>
                  {t('verifyEmailLoading') || 'Vérification en cours...'}
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-success mb-3" style={{ fontSize: '48px' }}>
                  <i className="bi bi-check-circle-fill" />
                </div>
                <p className="text-success mb-3" style={{ fontSize: '14px' }}>{message}</p>
                <p className="text-muted small mb-0">
                  {t('verifyEmailRedirect') || 'Redirection vers la connexion...'}
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
                  {t('goToLogin') || 'Aller à la connexion'}
                </Link>
                <p className="mt-3 small text-muted mb-0">
                  {t('verifyEmailResendHint') || 'Vous pouvez demander un nouvel email de vérification depuis la page de connexion.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
