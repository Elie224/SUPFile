import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../services/authStore';
import { userService, dashboardService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Settings() {
  const { user, logout, setUser } = useAuthStore();
  const { t, setLanguage: setLang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Profil
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [theme, setTheme] = useState('light');
  
  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  
  // Statistiques
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(32212254720);
  const [accountCreated, setAccountCreated] = useState('');
  const [lastLogin, setLastLogin] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userResponse, statsResponse] = await Promise.all([
        userService.getMe(),
        dashboardService.getStats()
      ]);
      
      const userData = userResponse.data.data;
      const stats = statsResponse.data.data;
      
      setEmail(userData.email || '');
      setDisplayName(userData.display_name || '');
      setAvatarUrl(userData.avatar_url || '');
      // Préférences
      const prefs = userData.preferences || {};
      setTheme(prefs.theme || 'light');
      // Forcer le français (langue principale du projet)
      setLang('fr');
      setQuotaUsed(stats.quota?.used || 0);
      setQuotaLimit(stats.quota?.limit || 32212254720);
      // Formater la date de création en français
      if (userData.created_at) {
        const createdDate = new Date(userData.created_at);
        setAccountCreated(createdDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }));
      } else {
        setAccountCreated('');
      }
      // Formater la dernière connexion avec l'heure en français
      if (userData.last_login_at) {
        const lastLoginDate = new Date(userData.last_login_at);
        setLastLogin(lastLoginDate.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }));
      } else {
        setLastLogin('Jamais');
      }
      
      // Mettre à jour le store
      if (setUser) {
        setUser({ ...userData, preferences: userData.preferences });
      }
    } catch (err) {
      showMessage('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await userService.updateProfile({ email, display_name: displayName });
      showMessage('success', 'Profil mis à jour avec succès');
      if (setUser && response.data.data) {
        setUser({ ...user, ...response.data.data });
      }
    } catch (err) {
      showMessage('error', 'Erreur: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'L\'image ne doit pas dépasser 5 MB');
      return;
    }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const API_URL = import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Erreur lors de l\'upload' } }));
        throw new Error(error.error?.message || 'Erreur lors de l\'upload');
      }
      
      const data = await response.json();
      setAvatarUrl(data.data.avatar_url);
      showMessage('success', 'Avatar mis à jour avec succès');
      loadUserData();
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setSaving(false);
      e.target.value = ''; // Réinitialiser l'input
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      showMessage('error', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await userService.changePassword(currentPassword, newPassword);
      showMessage('success', 'Mot de passe changé avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showMessage('error', 'Erreur: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarder les préférences (thème, etc.)
  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const currentUser = user || {};
      const prefs = currentUser.preferences || {};
      const newPreferences = { ...prefs, theme };

      const response = await userService.updatePreferences(newPreferences);

      // Appliquer immédiatement le thème
      const appliedTheme = theme || 'light';
      document.documentElement.setAttribute('data-theme', appliedTheme);
      localStorage.setItem('theme', appliedTheme);

      // Mettre à jour le store utilisateur
      if (setUser) {
        setUser({
          ...currentUser,
          preferences: response.data?.data?.preferences || newPreferences,
        });
      }

      showMessage('success', 'Préférences mises à jour avec succès');
    } catch (err) {
      showMessage('error', 'Erreur: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setSaving(false);
    }
  };


  // Calculer le pourcentage brut et formaté - Corriger l'incohérence : si used === 0, alors 0%
  const quotaPercentageRaw = quotaLimit > 0 && quotaUsed > 0 ? (quotaUsed / quotaLimit) * 100 : 0;
  const quotaPercentage = quotaUsed === 0 ? 0 : (quotaPercentageRaw < 1 
    ? Math.max(0.01, parseFloat(quotaPercentageRaw.toFixed(2)))
    : Math.round(quotaPercentageRaw));
  const quotaColor = quotaPercentageRaw >= 90 ? '#f44336' : quotaPercentageRaw >= 75 ? '#ff9800' : '#4caf50';

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'clamp(20px, 3vw, 32px)', fontSize: 'clamp(1.5em, 4vw, 2em)', color: 'var(--text-color)' }}>⚙️ {t('settings')}</h1>

      {message.text && (
        <div style={{
          padding: 12,
          marginBottom: 24,
          backgroundColor: 'var(--bg-secondary)',
          color: message.type === 'error' ? '#fca5a5' : '#bbf7d0',
          borderRadius: 8,
          border: `1px solid ${message.type === 'error' ? '#b91c1c' : '#15803d'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Informations du compte */}
      <section style={{ marginBottom: 'clamp(20px, 3vw, 32px)', padding: 'clamp(16px, 3vw, 24px)', backgroundColor: 'var(--bg-secondary)', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: 'clamp(1.2em, 3vw, 1.5em)', color: 'var(--text-color)' }}>
          <i className="bi bi-graph-up me-2"></i>
          {t('accountInfo')}
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 3vw, 24px)', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl.startsWith('http') ? avatarUrl : `${import.meta.env.VITE_API_URL || 'https://supfile-1.onrender.com'}${avatarUrl}`}
                alt="Avatar"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2196F3' }}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || email)}&size=80&background=2196F3&color=fff`;
                }}
              />
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2em',
                fontWeight: 'bold'
              }}>
                {(displayName || email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <label style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: '#2196F3',
              color: 'white',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: '2px solid white',
              fontSize: '14px'
            }}>
              📷
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
                disabled={saving}
              />
            </label>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{t('spaceUsed')}</strong>
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                    {formatBytes(quotaUsed)} / {formatBytes(quotaLimit)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {quotaUsed === 0 ? '0' : (quotaPercentageRaw < 1 
                      ? quotaPercentageRaw.toFixed(2) 
                      : quotaPercentage)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: 12,
                  backgroundColor: 'var(--bg-hover)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${quotaUsed > 0 ? Math.max(quotaPercentageRaw, 0.1) : 0}%`,
                    height: '100%',
                    backgroundColor: quotaColor,
                    transition: 'width 0.3s ease',
                    minWidth: quotaUsed > 0 ? '3px' : '0'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{t('accountCreated')}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.1em', color: 'var(--text-color)' }}>{accountCreated || 'N/A'}</p>
          </div>
          <div>
            <strong style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{t('lastLogin')}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.1em', color: 'var(--text-color)' }}>{lastLogin}</p>
          </div>
        </div>
      </section>

      {/* Profil */}
      <section style={{ marginBottom: 'clamp(20px, 3vw, 32px)', padding: 'clamp(16px, 3vw, 24px)', backgroundColor: 'var(--bg-color)', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: 'clamp(1.2em, 3vw, 1.5em)', color: 'var(--text-color)' }}>👤 {t('profile')}</h2>
        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('displayName')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('yourName')}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '1em',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </form>
      </section>

      {/* Préférences d'interface */}
      <section style={{ marginBottom: 32, padding: 24, backgroundColor: 'var(--bg-color)', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: 'var(--text-color)' }}>🎨 {t('interfacePreferences') || 'Préférences d’interface'}</h2>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>
            {t('theme') || 'Thème'}
          </label>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: theme === 'light' ? '2px solid #2196F3' : '1px solid var(--border-color)',
                backgroundColor: theme === 'light' ? '#E3F2FD' : 'var(--bg-secondary)',
                color: theme === 'light' ? '#1E293B' : 'var(--text-color)',
                cursor: 'pointer',
                minWidth: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>🌞</span>
              <span>{t('lightTheme') || 'Clair'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: theme === 'dark' ? '2px solid #2196F3' : '1px solid var(--border-color)',
                backgroundColor: theme === 'dark' ? '#1E293B' : 'var(--bg-secondary)',
                color: theme === 'dark' ? 'white' : 'var(--text-color)',
                cursor: 'pointer',
                minWidth: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span>🌙</span>
              <span>{t('darkTheme') || 'Sombre'}</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSavePreferences}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '1em',
            fontWeight: 'bold',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? t('saving') : (t('savePreferences') || 'Enregistrer les préférences')}
        </button>
      </section>

      {/* Mot de passe */}
      <section style={{ marginBottom: 32, padding: 24, backgroundColor: 'var(--bg-color)', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: 'var(--text-color)' }}>🔒 {t('security')}</h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '1em',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '1em',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
              required
              minLength={8}
              placeholder={t('newPassword') || 'Nouveau mot de passe'}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>{t('confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                fontSize: '1em',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? t('saving') : t('changePassword')}
          </button>
        </form>
      </section>


      {/* Déconnexion */}
      <section style={{ padding: 24, backgroundColor: 'var(--bg-secondary)', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: 'var(--text-color)' }}>🚪 {t('logout')}</h2>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
          Vous pouvez vous déconnecter de votre compte à tout moment.
        </p>
        <button
          onClick={logout}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '1em',
            fontWeight: 'bold'
          }}
        >
          {t('logout')}
        </button>
      </section>
    </div>
  );
}
