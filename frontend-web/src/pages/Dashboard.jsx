import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { dashboardService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import StorageChart from '../components/StorageChart';
import offlineDB from '../services/offlineDB';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const { t, language } = useLanguage();

  const loadDashboard = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      try {
        await offlineDB.init();
        const cached = await offlineDB.getUserMeta('dashboardStats');
        if (cached) {
          setStats(cached);
          setFromCache(true);
        }
      } catch (err) {
        console.warn('[Dashboard] Cache hors ligne indisponible:', err);
      }
      setLoading(false);
      return;
    }

    try {
      const response = await dashboardService.getStats();
      const data = response.data.data;
      setStats(data);
      setFromCache(false);
      try {
        await offlineDB.setUserMeta('dashboardStats', data);
      } catch (e) {
        console.warn('[Dashboard] Impossible de mettre en cache les stats:', e);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      try {
        const cached = await offlineDB.getUserMeta('dashboardStats');
        if (cached) {
          setStats(cached);
          setFromCache(true);
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  const recentFiles = useMemo(() => {
    return stats?.recent_files || [];
  }, [stats?.recent_files]);

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center p-5">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">{t('loading')}</span>
          </div>
          <p className="text-muted">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3 p-md-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {fromCache && (
        <div
          className="alert alert-warning mb-3 d-flex align-items-center gap-2"
          role="alert"
          style={{ fontSize: '14px' }}
        >
          <i className="bi bi-cloud-download"></i>
          <span>Données chargées depuis le cache local (mode hors ligne). Les chiffres peuvent ne pas être à jour.</span>
        </div>
      )}
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <h1 className="h2 mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-speedometer2 text-primary"></i>
          {t('dashboard') || 'Tableau de bord'}
        </h1>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={() => navigate('/files')}
          style={{ minHeight: '44px' }}
        >
          <i className="bi bi-folder-fill"></i>
          {t('myFiles') || 'Mes fichiers'}
        </button>
      </div>
      
      {stats && (
        <div className="row g-4">
          {/* Statistiques générales - En haut */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="card shadow-md h-100 fade-in">
              <div className="card-body text-center">
                <i className="bi bi-file-earmark text-primary" style={{ fontSize: '32px' }}></i>
                <h3 className="h4 mt-3 mb-1 text-primary">{stats.total_files}</h3>
                <p className="text-muted small mb-0">{t('totalFiles') || 'Total fichiers'}</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="card shadow-md h-100 fade-in">
              <div className="card-body text-center">
                <i className="bi bi-folder text-success" style={{ fontSize: '32px' }}></i>
                <h3 className="h4 mt-3 mb-1 text-success">{stats.total_folders}</h3>
                <p className="text-muted small mb-0">{t('totalFolders') || 'Total dossiers'}</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="card shadow-md h-100 fade-in">
              <div className="card-body text-center">
                <i className="bi bi-hdd-stack text-info" style={{ fontSize: '32px' }}></i>
                <h3 className="h4 mt-3 mb-1 text-info">{formatBytes(stats.quota.used)}</h3>
                <p className="text-muted small mb-0">{t('used') || 'Utilisé'}</p>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <div className="card shadow-md h-100 fade-in">
              <div className="card-body text-center">
                <i className="bi bi-hdd text-warning" style={{ fontSize: '32px' }}></i>
                <h3 className="h4 mt-3 mb-1 text-warning">{formatBytes(stats.quota.available)}</h3>
                <p className="text-muted small mb-0">{t('available') || 'Disponible'}</p>
              </div>
            </div>
          </div>

          {/* Quota - Carte principale */}
          <div className="col-12">
            <div className="card shadow-md mb-4 fade-in">
              <div className="card-header" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <i className="bi bi-hdd-stack text-primary"></i>
                  {t('storageSpace') || 'Espace de stockage'}
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-color)' }}>{t('used')}:</strong> {formatBytes(stats.quota.used)}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-color)' }}>{t('available')}:</strong> {formatBytes(stats.quota.available)}
                  </span>
                </div>
                {(() => {
                  // Calcul cohérent du pourcentage : si used === 0, alors 0%
                  const percentageRaw = stats.quota.used === 0 ? 0 : (stats.quota.percentageRaw || stats.quota.percentage || 0);
                  const percentage = stats.quota.used === 0 ? 0 : (stats.quota.percentage < 1 
                    ? stats.quota.percentage.toFixed(2) 
                    : Math.round(stats.quota.percentage));
                  const barWidth = percentageRaw > 0 ? Math.max(percentageRaw, 0.1) : 0;
                  const barColor = percentageRaw > 80 ? 'danger' : percentageRaw > 75 ? 'warning' : 'success';
                  
                  return (
                    <div className="progress" style={{ height: '24px', backgroundColor: 'var(--bg-hover)', borderRadius: '12px', overflow: 'hidden' }}>
                      {barWidth > 0 && (
                        <div 
                          className={`progress-bar`}
                          role="progressbar" 
                          style={{ 
                            width: `${barWidth}%`,
                            background: barColor === 'success' 
                              ? 'linear-gradient(90deg, #22C55E 0%, #16A34A 100%)'
                              : barColor === 'warning'
                              ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                              : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                            borderRadius: '12px'
                          }}
                        >
                          {percentageRaw > 5 && (
                            <span className="small fw-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                              {percentageRaw < 1 ? percentageRaw.toFixed(2) : Math.round(percentageRaw)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <small className="d-block text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
                  {(() => {
                    const used = Number(stats.quota.used) || 0;
                    const limit = Number(stats.quota.limit) || 0;
                    const pct = limit > 0 && used > 0 ? Math.min(100, (used / limit) * 100) : 0;
                    const pctDisplay = used === 0 ? 0 : pct < 1 ? pct.toFixed(2) : Math.round(pct);
                    return `${pctDisplay}% ${t('usedOf')} ${formatBytes(limit)}`;
                  })()}
                </small>
              </div>
            </div>
          </div>

          {/* Répartition par type avec graphique circulaire */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-md mb-4 fade-in">
              <div className="card-header" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <i className="bi bi-pie-chart text-primary"></i>
                  {t('breakdownByType') || 'Répartition par type'}
                </h5>
              </div>
              <div className="card-body">
                {/* Graphique circulaire */}
                <div className="d-flex justify-content-center mb-4">
                  <StorageChart 
                    used={stats.quota.used} 
                    total={stats.quota.limit}
                    breakdown={stats.breakdown}
                    formatBytes={formatBytes}
                  />
                </div>
                <hr className="my-3" />
                {[
                  { key: 'images', label: t('images'), color: '#4CAF50', icon: 'bi-image', value: stats.breakdown.images },
                  { key: 'videos', label: t('videos'), color: '#2196F3', icon: 'bi-camera-video', value: stats.breakdown.videos },
                  { key: 'documents', label: t('documents'), color: '#FF9800', icon: 'bi-file-earmark-pdf', value: stats.breakdown.documents },
                  { key: 'audio', label: t('audio'), color: '#9C27B0', icon: 'bi-music-note-beamed', value: stats.breakdown.audio },
                  { key: 'other', label: t('others'), color: '#607D8B', icon: 'bi-file-earmark', value: stats.breakdown.other }
                ].map((item) => {
                  const percentage = stats.breakdown.total > 0 ? (item.value / stats.breakdown.total * 100) : 0;
                  return (
                    <div key={item.key} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small fw-medium d-flex align-items-center gap-2" style={{ color: 'var(--text-color)' }}>
                          <i className={`bi ${item.icon}`} style={{ color: item.color }}></i>
                          {item.label}
                        </span>
                        <span className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {formatBytes(item.value)}
                        </span>
                      </div>
                      <div className="progress storage-progress-track" style={{ height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                        <div 
                          className="progress-bar"
                          role="progressbar" 
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: item.color,
                            borderRadius: '5px',
                            transition: 'width 0.5s ease'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fichiers récents */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-md mb-4 fade-in">
              <div className="card-header d-flex justify-content-between align-items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <h5 className="mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-color)' }}>
                  <i className="bi bi-clock-history text-primary"></i>
                  {t('recentFiles') || 'Fichiers récents'}
                </h5>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/files')}
                >
                  <i className="bi bi-arrow-right me-1"></i>
                  {t('viewAll') || 'Voir tout'}
                </button>
              </div>
              <div className="card-body">
                {recentFiles.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {recentFiles.map((file, index) => (
                      <li 
                        key={file.id}
                        className="py-2 border-bottom"
                        style={{ borderColor: index < recentFiles.length - 1 ? 'var(--border-color)' : 'transparent' }}
                      >
                        <div 
                          className="d-flex align-items-center gap-2 cursor-pointer"
                          onClick={() => navigate(`/preview/${file.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-file-earmark text-primary"></i>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-medium text-truncate" style={{ color: 'var(--text-color)' }}>{file.name}</div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                              {formatBytes(file.size)} • {new Date(file.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                            </small>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: '48px' }}></i>
                    <p className="text-muted mt-3 mb-0">{t('noRecentFiles') || 'Aucun fichier récent'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
