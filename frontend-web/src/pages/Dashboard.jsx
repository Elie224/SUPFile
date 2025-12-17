import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../services/authStore';
import { dashboardService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div style={{ padding: 24 }}>{t('loading')}</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>{t('dashboard')}</h1>
      
      {stats && (
        <>
          {/* Quota */}
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <h2>{t('storageSpace')}</h2>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{t('used')}: {formatBytes(stats.quota.used)}</span>
                <span>{t('available')}: {formatBytes(stats.quota.available)}</span>
              </div>
              <div style={{ width: '100%', height: 24, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${stats.quota.percentageRaw || stats.quota.percentage}%`,
                    height: '100%',
                    backgroundColor: (stats.quota.percentageRaw || stats.quota.percentage) > 80 ? '#f44336' : '#4caf50',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                {stats.quota.percentage < 1 
                  ? stats.quota.percentage.toFixed(2) 
                  : stats.quota.percentage}% {t('usedOf')} {formatBytes(stats.quota.limit)}
              </div>
            </div>
          </div>

          {/* Répartition avec graphique */}
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <h2>{t('breakdownByType')}</h2>
            <div style={{ marginTop: 16 }}>
              {/* Graphique en barres horizontales */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ width: 100, fontSize: 14 }}>{t('images')}</span>
                  <div style={{ flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.breakdown.total > 0 ? (stats.breakdown.images / stats.breakdown.total * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#4CAF50',
                      transition: 'width 0.3s'
                    }}></div>
                    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 12, fontWeight: 'bold', color: '#333' }}>
                      {formatBytes(stats.breakdown.images)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ width: 100, fontSize: 14 }}>{t('videos')}</span>
                  <div style={{ flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.breakdown.total > 0 ? (stats.breakdown.videos / stats.breakdown.total * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#2196F3',
                      transition: 'width 0.3s'
                    }}></div>
                    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 12, fontWeight: 'bold', color: '#333' }}>
                      {formatBytes(stats.breakdown.videos)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ width: 100, fontSize: 14 }}>{t('documents')}</span>
                  <div style={{ flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.breakdown.total > 0 ? (stats.breakdown.documents / stats.breakdown.total * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#FF9800',
                      transition: 'width 0.3s'
                    }}></div>
                    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 12, fontWeight: 'bold', color: '#333' }}>
                      {formatBytes(stats.breakdown.documents)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ width: 100, fontSize: 14 }}>{t('audio')}</span>
                  <div style={{ flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.breakdown.total > 0 ? (stats.breakdown.audio / stats.breakdown.total * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#9C27B0',
                      transition: 'width 0.3s'
                    }}></div>
                    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 12, fontWeight: 'bold', color: '#333' }}>
                      {formatBytes(stats.breakdown.audio)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ width: 100, fontSize: 14 }}>{t('others')}</span>
                  <div style={{ flex: 1, height: 20, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.breakdown.total > 0 ? (stats.breakdown.other / stats.breakdown.total * 100) : 0}%`,
                      height: '100%',
                      backgroundColor: '#607D8B',
                      transition: 'width 0.3s'
                    }}></div>
                    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 12, fontWeight: 'bold', color: '#333' }}>
                      {formatBytes(stats.breakdown.other)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fichiers récents */}
          <div style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <h2>{t('recentFiles')}</h2>
            {stats.recent_files && stats.recent_files.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {stats.recent_files.map((file) => (
                  <li key={file.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    {file.name} ({formatBytes(file.size)}) - {new Date(file.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('noRecentFiles')}</p>
            )}
          </div>

          {/* Statistiques générales */}
          <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
            <h2>{t('statistics')}</h2>
            <div style={{ marginTop: 8 }}>
              <div>{t('totalFiles')}: {stats.total_files}</div>
              <div>{t('totalFolders')}: {stats.total_folders}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

