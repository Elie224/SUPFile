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
      // Forcer le français
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


  // Calculer le pourcentage brut et formaté
  const quotaPercentageRaw = quotaLimit > 0 && quotaUsed > 0 ? (quotaUsed / quotaLimit) * 100 : 0;
  const quotaPercentage = quotaPercentageRaw < 1 
    ? Math.max(0.01, parseFloat(quotaPercentageRaw.toFixed(2)))
    : Math.round(quotaPercentageRaw);
  const quotaColor = quotaPercentageRaw >= 90 ? '#f44336' : quotaPercentageRaw >= 75 ? '#ff9800' : '#4caf50';

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 32, fontSize: '2em', color: '#333' }}>⚙️ {t('settings')}</h1>

      {message.text && (
        <div style={{
          padding: 12,
          marginBottom: 24,
          backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
          color: message.type === 'error' ? '#c62828' : '#2e7d32',
          borderRadius: 8,
          border: `1px solid ${message.type === 'error' ? '#ef5350' : '#66bb6a'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Informations du compte */}
      <section style={{ marginBottom: 32, padding: 24, backgroundColor: '#f5f5f5', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: '#333' }}>📊 {t('accountInfo')}</h2>
        
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20 }}>
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
              <strong style={{ color: '#666', fontSize: '0.9em' }}>{t('spaceUsed')}</strong>
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                    {formatBytes(quotaUsed)} / {formatBytes(quotaLimit)}
                  </span>
                  <span style={{ color: '#666' }}>
                    {quotaPercentageRaw < 1 
                      ? quotaPercentageRaw.toFixed(2) 
                      : quotaPercentage}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: 12,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 6,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${quotaPercentageRaw}%`,
                    height: '100%',
                    backgroundColor: quotaColor,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <strong style={{ color: '#666', fontSize: '0.9em' }}>{t('accountCreated')}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.1em' }}>{accountCreated || 'N/A'}</p>
          </div>
          <div>
            <strong style={{ color: '#666', fontSize: '0.9em' }}>{t('lastLogin')}</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.1em' }}>{lastLogin}</p>
          </div>
        </div>
      </section>

      {/* Profil */}
      <section style={{ marginBottom: 32, padding: 24, backgroundColor: 'white', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: '#333' }}>👤 {t('profile')}</h2>
        <form onSubmit={handleUpdateProfile}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#555' }}>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#555' }}>{t('displayName')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('yourName')}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: '1em'
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

      {/* Mot de passe */}
      <section style={{ marginBottom: 32, padding: 24, backgroundColor: 'white', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: '#333' }}>🔒 {t('security')}</h2>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#555' }}>{t('currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: '1em'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#555' }}>{t('newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: '1em'
              }}
              required
              minLength={8}
              placeholder={t('passwordMinLength')}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: '#555' }}>{t('confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                padding: 12,
                width: '100%',
                maxWidth: 400,
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: '1em'
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
      <section style={{ padding: 24, backgroundColor: '#fff3e0', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 20, fontSize: '1.5em', color: '#333' }}>🚪 {t('logout')}</h2>
        <p style={{ marginBottom: 16, color: '#666' }}>
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
