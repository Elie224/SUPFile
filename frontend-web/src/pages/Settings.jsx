import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../services/authStore';
import { userService, dashboardService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config';
import { formatBytes, computeStorage, formatPercentage, DEFAULT_QUOTA_LIMIT_BYTES } from '../utils/storageUtils';

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
  
  // Double authentification (2FA)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  
  // Statistiques
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(DEFAULT_QUOTA_LIMIT_BYTES);
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
      setTwoFactorEnabled(userData.two_factor_enabled || false);
      // Forcer le français (langue principale du projet)
      setLang('fr');
      setQuotaUsed(stats.quota?.used || 0);
      setQuotaLimit(stats.quota?.limit || DEFAULT_QUOTA_LIMIT_BYTES);
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
      // Hors ligne ou erreur réseau : afficher les données du store pour permettre la navigation
      if (user) {
        const storedUser = user;
        setEmail(storedUser.email || '');
        setDisplayName(storedUser.display_name || '');
        setAvatarUrl(storedUser.avatar_url || '');
        setTwoFactorEnabled(!!storedUser.two_factor_enabled);
        setAccountCreated('');
        setLastLogin('Jamais');
        showMessage('', 'Données en cache (hors ligne). Activer la 2FA nécessite une connexion.');
      } else {
        showMessage('error', 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
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
      // Recharger les données pour s'assurer que tout est à jour
      await loadUserData();
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
      
      const apiBase = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
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
    
    if (!currentPassword) {
      showMessage('error', 'Veuillez entrer votre mot de passe actuel');
      return;
    }
    
    if (!newPassword) {
      showMessage('error', 'Veuillez entrer un nouveau mot de passe');
      return;
    }
    
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

  // Démarrer la configuration du 2FA
  const handleSetup2FA = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const apiBase = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setQrCode(data.data.qrCode);
        setSecret(data.data.secret);
        setBackupCodes(data.data.backupCodes);
        setShow2FASetup(true);
      } else {
        showMessage('error', data.error?.message || 'Erreur lors de la configuration du 2FA');
      }
    } catch (err) {
      showMessage('error', 'Erreur: ' + (err.message || 'Impossible de configurer le 2FA'));
    } finally {
      setSaving(false);
    }
  };

  // Vérifier et activer le 2FA
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    if (!verificationCode) {
      showMessage('error', 'Veuillez entrer le code de vérification');
      setSaving(false);
      return;
    }

    try {
      const apiBase = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: secret,
          backupCodes: backupCodes
        })
      });

      const data = await response.json();

      if (data.success) {
        setTwoFactorEnabled(true);
        setShow2FASetup(false);
        setVerificationCode('');
        showMessage('success', 'Double authentification activée avec succès');
        await loadUserData();
      } else {
        showMessage('error', data.error?.message || 'Code de vérification invalide');
      }
    } catch (err) {
      showMessage('error', 'Erreur: ' + (err.message || 'Impossible de vérifier le code'));
    } finally {
      setSaving(false);
    }
  };

  // Désactiver le 2FA
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    if (!disablePassword) {
      showMessage('error', 'Veuillez entrer votre mot de passe');
      setSaving(false);
      return;
    }

    try {
      const apiBase = (typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: disablePassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setTwoFactorEnabled(false);
        setDisablePassword('');
        showMessage('success', 'Double authentification désactivée');
        await loadUserData();
      } else {
        showMessage('error', data.error?.message || 'Mot de passe incorrect');
      }
    } catch (err) {
      showMessage('error', 'Erreur: ' + (err.message || 'Impossible de désactiver le 2FA'));
    } finally {
      setSaving(false);
    }
  };


  const storage = computeStorage(quotaUsed, quotaLimit);
  const quotaColor = storage.color === 'danger' ? '#f44336' : storage.color === 'warning' ? '#ff9800' : '#4caf50';

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
                src={avatarUrl.startsWith('http') ? avatarUrl : `${(typeof API_URL === 'string' && API_URL) ? API_URL : 'https://supfile.fly.dev'}${avatarUrl}`}
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
                    {formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatPercentage(storage.raw)}%
                  </span>
                </div>
                <div
                  className="storage-progress-track"
                  style={{
                    width: '100%',
                    height: 12,
                    borderRadius: 6,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: 'var(--progress-track-bg)'
                  }}
                >
                  <div style={{
                    width: `${storage.barWidth}%`,
                    height: '100%',
                    backgroundColor: quotaColor,
                    transition: 'width 0.3s ease',
                    minWidth: storage.usedBytes > 0 ? '3px' : '0'
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

      {/* Section dédiée 2FA - visible entre Préférences et Sécurité */}
      <section id="2fa" style={{ marginBottom: 32, padding: 24, backgroundColor: '#f0fdf4', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '1px solid #86efac' }}>
        <h2 style={{ marginBottom: 12, fontSize: '1.5em', color: 'var(--text-color)' }}>
          🔐 Double authentification (2FA)
        </h2>
        <p style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: '0.95em' }}>
          Renforcez la sécurité de votre compte. À chaque connexion, entrez un code depuis Google Authenticator ou Authy.
        </p>

        {!twoFactorEnabled ? (
          <>
            {!show2FASetup ? (
              <button
                onClick={handleSetup2FA}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Configuration...' : 'Activer le 2FA'}
              </button>
            ) : (
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 20, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 16, color: 'var(--text-color)' }}>Configuration du 2FA</h3>
                
                <div style={{ marginBottom: 20 }}>
                  <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
                    1. Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                  </p>
                  {qrCode && (
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <img src={qrCode} alt="QR Code 2FA" style={{ maxWidth: 200, border: '2px solid var(--border-color)', borderRadius: 8 }} />
                    </div>
                  )}
                  <p style={{ fontSize: '0.9em', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Ou entrez manuellement ce code :
                  </p>
                  <code style={{ 
                    display: 'block', 
                    padding: 12, 
                    backgroundColor: 'var(--bg-color)', 
                    borderRadius: 4, 
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: 'var(--text-color)'
                  }}>
                    {secret}
                  </code>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
                    2. Sauvegardez ces codes de secours (à utiliser si vous perdez l'accès à votre application) :
                  </p>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                    gap: 8,
                    padding: 12,
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: 4
                  }}>
                    {backupCodes.map((code, idx) => (
                      <code key={idx} style={{ 
                        padding: 8, 
                        backgroundColor: 'var(--bg-secondary)', 
                        borderRadius: 4,
                        textAlign: 'center',
                        fontFamily: 'monospace',
                        fontSize: '0.9em',
                        color: 'var(--text-color)'
                      }}>
                        {code}
                      </code>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleVerify2FA}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      3. Entrez le code à 6 chiffres de votre application :
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength="6"
                      style={{
                        padding: 12,
                        width: '100%',
                        maxWidth: 200,
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        fontSize: '1.2em',
                        textAlign: 'center',
                        letterSpacing: '0.3em',
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--bg-color)',
                        color: 'var(--text-color)'
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      disabled={saving || verificationCode.length !== 6}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        cursor: (saving || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                        fontSize: '1em',
                        fontWeight: 'bold',
                        opacity: (saving || verificationCode.length !== 6) ? 0.6 : 1
                      }}
                    >
                      {saving ? 'Vérification...' : 'Activer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FASetup(false);
                        setVerificationCode('');
                        setQrCode('');
                        setSecret('');
                        setBackupCodes([]);
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-color)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: '1em',
                        fontWeight: 'bold'
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 20, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: '2em' }}>✅</span>
              <div>
                <p style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: 4 }}>
                  Double authentification activée
                </p>
                <p style={{ fontSize: '0.9em', color: 'var(--text-secondary)' }}>
                  Votre compte est protégé par la double authentification
                </p>
              </div>
            </div>
            
            <form onSubmit={handleDisable2FA}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  Entrez votre mot de passe pour désactiver le 2FA :
                </label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  style={{
                    padding: 12,
                    width: '100%',
                    maxWidth: 300,
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    fontSize: '1em',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)'
                  }}
                  required
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
                {saving ? 'Désactivation...' : 'Désactiver le 2FA'}
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Sécurité - mot de passe */}
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

      {/* Déconnexion - section séparée */}
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
