import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return children;
  }

  const navLinks = [
    { path: '/dashboard', label: t('dashboard') },
    { path: '/files', label: t('files') },
    { path: '/search', label: t('search') },
    { path: '/trash', label: t('trash') },
    { path: '/settings', label: t('settings') },
  ];

  return (
    <div>
      <nav style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #eee', 
        backgroundColor: '#f5f5f5',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* Menu hamburger pour mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '20px',
              minWidth: '44px',
              minHeight: '44px'
            }}
            className="mobile-menu-toggle"
          >
            ☰
          </button>

          {/* Navigation desktop */}
          <div className="nav-links-desktop" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '8px 12px',
                  textDecoration: 'none',
                  color: location.pathname === link.path ? '#2196F3' : '#333',
                  fontWeight: location.pathname === link.path ? 'bold' : 'normal',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div 
              className="nav-links-mobile"
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                marginTop: '12px',
                gap: '8px',
                borderTop: '1px solid #ddd',
                paddingTop: '12px'
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: '12px',
                    textDecoration: 'none',
                    color: location.pathname === link.path ? '#2196F3' : '#333',
                    fontWeight: location.pathname === link.path ? 'bold' : 'normal',
                    borderRadius: '4px',
                    backgroundColor: location.pathname === link.path ? '#e3f2fd' : 'transparent',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* User info et logout */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flexWrap: 'wrap',
            marginLeft: 'auto'
          }}>
            <span style={{ 
              fontSize: '14px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '150px'
            }}>
              {user.email}
            </span>
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f44336', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '14px',
                minHeight: '44px',
                whiteSpace: 'nowrap'
              }}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </nav>
      {children}
      <style>{`
        @media (max-width: 767px) {
          .mobile-menu-toggle {
            display: block !important;
          }
          .nav-links-desktop {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .nav-links-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

