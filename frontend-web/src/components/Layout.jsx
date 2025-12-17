import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage(); // Inclure language pour forcer le re-render

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return children;
  }

  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee', backgroundColor: '#f5f5f5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to="/dashboard" style={{ marginRight: 16, textDecoration: 'none', color: location.pathname === '/dashboard' ? '#2196F3' : '#333' }}>
              {t('dashboard')}
            </Link>
            <Link to="/files" style={{ marginRight: 16, textDecoration: 'none', color: location.pathname === '/files' ? '#2196F3' : '#333' }}>
              {t('files')}
            </Link>
            <Link to="/search" style={{ marginRight: 16, textDecoration: 'none', color: location.pathname === '/search' ? '#2196F3' : '#333' }}>
              {t('search')}
            </Link>
            <Link to="/trash" style={{ marginRight: 16, textDecoration: 'none', color: location.pathname === '/trash' ? '#2196F3' : '#333' }}>
              {t('trash')}
            </Link>
            <Link to="/settings" style={{ marginRight: 16, textDecoration: 'none', color: location.pathname === '/settings' ? '#2196F3' : '#333' }}>
              {t('settings')}
            </Link>
          </div>
          <div>
            <span style={{ marginRight: 16 }}>{user.email}</span>
            <button onClick={handleLogout} style={{ padding: '4px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}

