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
    return (
      <div style={{ 
        padding: '24px 16px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{ fontSize: '16px', color: '#666' }}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '16px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '28px', 
        fontWeight: '600', 
        marginBottom: '24px',
        color: '#333'
      }}>
        {t('dashboard')}
      </h1>
      
      {stats && (
        <>
          {/* Quota */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px', 
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#333'
            }}>
              {t('storageSpace')}
            </h2>
            <div style={{ marginTop: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#333' }}>{t('used')}:</strong> {formatBytes(stats.quota.used)}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong style={{ color: '#333' }}>{t('available')}:</strong> {formatBytes(stats.quota.available)}
                </div>
              </div>
              <div style={{ 
                width: '100%', 
                height: '28px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '14px', 
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
              }}>
                <div
                  style={{
                    width: `${stats.quota.percentageRaw || stats.quota.percentage}%`,
                    height: '100%',
                    backgroundColor: (stats.quota.percentageRaw || stats.quota.percentage) > 80 ? '#f44336' : '#4caf50',
                    transition: 'width 0.5s ease',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px',
                    minWidth: stats.quota.percentageRaw > 0 ? '28px' : '0'
                  }}
                >
                  {(stats.quota.percentageRaw || stats.quota.percentage) > 5 && (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '600', 
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                      {stats.quota.percentage < 1 
                        ? stats.quota.percentage.toFixed(2) 
                        : stats.quota.percentage}%
                    </span>
                  )}
                </div>
              </div>
              <div style={{ 
                marginTop: '8px', 
                fontSize: '13px', 
                color: '#666',
                textAlign: 'center'
              }}>
                {stats.quota.percentage < 1 
                  ? stats.quota.percentage.toFixed(2) 
                  : stats.quota.percentage}% {t('usedOf')} {formatBytes(stats.quota.limit)}
              </div>
            </div>
          </div>

          {/* Répartition avec graphique */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px', 
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#333'
            }}>
              {t('breakdownByType')}
            </h2>
            <div style={{ marginTop: '16px' }}>
              {/* Graphique en barres horizontales */}
              {[
                { key: 'images', label: t('images'), color: '#4CAF50', value: stats.breakdown.images },
                { key: 'videos', label: t('videos'), color: '#2196F3', value: stats.breakdown.videos },
                { key: 'documents', label: t('documents'), color: '#FF9800', value: stats.breakdown.documents },
                { key: 'audio', label: t('audio'), color: '#9C27B0', value: stats.breakdown.audio },
                { key: 'other', label: t('others'), color: '#607D8B', value: stats.breakdown.other }
              ].map((item) => {
                const percentage = stats.breakdown.total > 0 ? (item.value / stats.breakdown.total * 100) : 0;
                return (
                  <div key={item.key} style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#333',
                        minWidth: '80px'
                      }}>
                        {item.label}
                      </span>
                      <span style={{ 
                        fontSize: '13px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        {formatBytes(item.value)}
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '24px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '12px', 
                      position: 'relative', 
                      overflow: 'hidden',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: item.color,
                        transition: 'width 0.5s ease',
                        borderRadius: '12px',
                        minWidth: percentage > 0 ? '4px' : '0'
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fichiers récents */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px', 
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#333'
            }}>
              {t('recentFiles')}
            </h2>
            {stats.recent_files && stats.recent_files.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {stats.recent_files.map((file, index) => (
                  <li 
                    key={file.id} 
                    style={{ 
                      padding: '12px 0', 
                      borderBottom: index < stats.recent_files.length - 1 ? '1px solid #f0f0f0' : 'none',
                      fontSize: '14px',
                      color: '#333'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {formatBytes(file.size)} • {new Date(file.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                {t('noRecentFiles')}
              </p>
            )}
          </div>

          {/* Statistiques générales */}
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#ffffff',
            border: '1px solid #e0e0e0', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#333'
            }}>
              {t('statistics')}
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#2196F3', marginBottom: '4px' }}>
                  {stats.total_files}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>{t('totalFiles')}</div>
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '600', color: '#4CAF50', marginBottom: '4px' }}>
                  {stats.total_folders}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>{t('totalFolders')}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

