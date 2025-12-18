import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { dashboardService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  // Memoization de la fonction de chargement
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

  // Memoization de formatBytes
  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }, []);

  // Memoization des fichiers récents
  const recentFiles = useMemo(() => {
    return stats?.recent_files || [];
  }, [stats?.recent_files]);

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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '600', 
          margin: 0,
          color: '#333'
        }}>
          {t('dashboard')}
        </h1>
        <button
          onClick={() => navigate('/files')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1976D2';
            e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2196F3';
            e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
          }}
        >
          <span style={{ fontSize: '20px' }}>📁</span>
          {t('myFiles')}
        </button>
      </div>
      
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
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                position: 'relative'
              }}>
                {(() => {
                  const percentageRaw = stats.quota.percentageRaw || stats.quota.percentage || 0;
                  // Pour les très petits pourcentages, utiliser une largeur minimale visible
                  // Calculer la largeur en pourcentage avec un minimum de 0.1% pour la visibilité
                  const barWidth = stats.quota.used > 0 
                    ? Math.max(percentageRaw, 0.1)
                    : 0;
                  const barColor = percentageRaw > 80 ? '#f44336' : percentageRaw > 75 ? '#ff9800' : '#4caf50';
                  
                  return (
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        transition: 'width 0.5s ease',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: '8px',
                        minWidth: stats.quota.used > 0 ? '3px' : '0'
                      }}
                    >
                      {percentageRaw > 5 && (
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
                  );
                })()}
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0,
                color: '#333'
              }}>
                {t('recentFiles')}
              </h2>
              <button
                onClick={() => navigate('/files')}
                style={{
                  padding: '14px 28px',
                  backgroundColor: '#1976D2',
                  color: '#FFFFFF',
                  border: '2px solid #1976D2',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  whiteSpace: 'nowrap',
                  minWidth: '140px',
                  justifyContent: 'center',
                  textTransform: 'none',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1565C0';
                  e.currentTarget.style.borderColor = '#1565C0';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(25, 118, 210, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976D2';
                  e.currentTarget.style.borderColor = '#1976D2';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.5)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                <span style={{ fontWeight: '700', fontSize: '16px' }}>{t('viewAll')}</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: '1' }}>→</span>
              </button>
            </div>
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

