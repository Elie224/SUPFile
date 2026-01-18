import React from 'react';

/**
 * Composant pour afficher un graphique circulaire (pie chart) du stockage
 * Utilise SVG pur pour les performances
 */
export default function StorageChart({ used, total, breakdown, formatBytes }) {
  const percentage = total > 0 ? (used / total * 100) : 0;
  const circumference = 2 * Math.PI * 45; // rayon = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Calculer les pourcentages pour chaque type
  const breakdownItems = breakdown ? [
    { key: 'images', label: 'Images', color: '#4CAF50', value: breakdown.images || 0 },
    { key: 'videos', label: 'Vidéos', color: '#2196F3', value: breakdown.videos || 0 },
    { key: 'documents', label: 'Documents', color: '#FF9800', value: breakdown.documents || 0 },
    { key: 'audio', label: 'Audio', color: '#9C27B0', value: breakdown.audio || 0 },
    { key: 'other', label: 'Autres', color: '#607D8B', value: breakdown.other || 0 },
  ].filter(item => item.value > 0) : [];

  const totalBreakdown = breakdownItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="d-flex flex-column align-items-center">
      {/* Graphique circulaire SVG */}
      <div className="position-relative" style={{ width: '120px', height: '120px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          {/* Cercle de fond */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="10"
          />
          {/* Cercle de progression */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={percentage > 80 ? '#f44336' : percentage > 75 ? '#ff9800' : '#4caf50'}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Texte centré */}
        <div 
          className="position-absolute d-flex flex-column align-items-center justify-content-center"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
          }}
        >
          <span className="fw-bold" style={{ fontSize: '24px', lineHeight: 1 }}>
            {percentage.toFixed(1)}%
          </span>
          <span className="small text-muted" style={{ fontSize: '11px' }}>
            utilisé
          </span>
        </div>
      </div>

      {/* Légende détaillée */}
      {breakdownItems.length > 0 && (
        <div className="mt-3" style={{ width: '100%' }}>
          <div className="small text-muted mb-2">Répartition:</div>
          {breakdownItems.map((item) => {
            const itemPercentage = totalBreakdown > 0 ? (item.value / totalBreakdown * 100) : 0;
            return (
              <div key={item.key} className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-1">
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: item.color,
                        borderRadius: '2px',
                      }}
                    ></div>
                    <span className="small">{item.label}</span>
                  </div>
                  <span className="small text-muted">
                    {formatBytes ? formatBytes(item.value) : `${(item.value / 1024 / 1024).toFixed(1)} MB`}
                  </span>
                </div>
                <div className="progress" style={{ height: '6px' }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${itemPercentage}%`, backgroundColor: item.color }}
                    aria-valuenow={itemPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}