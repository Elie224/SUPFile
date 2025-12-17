import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuthStore();
  const navigate = useNavigate();
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render

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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '24px', textAlign: 'center', color: '#333' }}>
          {t('signup')}
        </h1>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loading}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              {t('passwordRequirements')}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '500' }}>
              {t('confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? t('signupLoading') : t('signupButton')}
          </button>
        </form>

        {/* Séparateur */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: '#999' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
          <span style={{ padding: '0 16px', fontSize: '14px' }}>{t('or')}</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
        </div>

        {/* Boutons OAuth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => {
              const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
              window.location.href = `${apiUrl}/api/auth/google`;
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#fff',
              color: '#333',
              border: '2px solid #4285f4',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#1a73e8';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#fff';
              e.target.style.borderColor = '#4285f4';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
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
          
          <button
            type="button"
            onClick={() => {
              const apiUrl = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
              window.location.href = `${apiUrl}/api/auth/github`;
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#1a1a1a';
              e.target.style.borderColor = '#1a1a1a';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#000000';
              e.target.style.borderColor = '#000000';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span style={{ color: '#ffffff', fontWeight: '600' }}>{t('continueWith')} GitHub</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          {t('hasAccount')}{' '}
          <Link to="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>
            {t('loginLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}



