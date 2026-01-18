import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { dashboardService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import StorageChart from '../components/StorageChart';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  const loadDashboard = useCallback(async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
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
              <div className="card-header bg-light">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-hdd-stack text-primary"></i>
                  {t('storageSpace') || 'Espace de stockage'}
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
                  <span className="text-muted">
                    <strong>{t('used')}:</strong> {formatBytes(stats.quota.used)}
                  </span>
                  <span className="text-muted">
                    <strong>{t('available')}:</strong> {formatBytes(stats.quota.available)}
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
                    <div className="progress" style={{ height: '28px' }}>
                      {barWidth > 0 && (
                        <div 
                          className={`progress-bar bg-${barColor}`}
                          role="progressbar" 
                          style={{ width: `${barWidth}%` }}
                        >
                          {percentageRaw > 5 && (
                            <span className="small fw-bold">
                              {typeof percentage === 'string' ? percentage : percentage.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <small className="text-muted d-block text-center mt-2">
                  {stats.quota.used === 0 
                    ? `0% ${t('usedOf')} ${formatBytes(stats.quota.limit)}`
                    : `${stats.quota.percentage < 1 
                      ? stats.quota.percentage.toFixed(2) 
                      : Math.round(stats.quota.percentage)}% ${t('usedOf')} ${formatBytes(stats.quota.limit)}`}
                </small>
              </div>
            </div>
          </div>

          {/* Répartition par type avec graphique circulaire */}
          <div className="col-12 col-lg-6">
            <div className="card shadow-md mb-4 fade-in">
              <div className="card-header bg-light">
                <h5 className="mb-0 d-flex align-items-center gap-2">
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
                        <span className="small fw-medium d-flex align-items-center gap-2">
                          <i className={`bi ${item.icon}`} style={{ color: item.color }}></i>
                          {item.label}
                        </span>
                        <span className="small text-muted fw-semibold">
                          {formatBytes(item.value)}
                        </span>
                      </div>
                      <div className="progress" style={{ height: '24px' }}>
                        <div 
                          className="progress-bar"
                          role="progressbar" 
                          style={{ width: `${percentage}%`, backgroundColor: item.color }}
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
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0 d-flex align-items-center gap-2">
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
                        style={{ borderColor: index < recentFiles.length - 1 ? '#f0f0f0' : 'transparent' }}
                      >
                        <div 
                          className="d-flex align-items-center gap-2 cursor-pointer"
                          onClick={() => navigate(`/preview/${file.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-file-earmark text-primary"></i>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-medium text-truncate">{file.name}</div>
                            <small className="text-muted">
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
