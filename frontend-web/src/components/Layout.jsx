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
        padding: '0',
        borderBottom: '1px solid #e0e0e0', 
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {/* Header principal */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '12px 16px',
          minHeight: '56px'
        }}>
          {/* Menu hamburger + Logo/Titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                padding: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '24px',
                minWidth: '44px',
                minHeight: '44px',
                color: '#333',
                transition: 'background-color 0.2s'
              }}
              className="mobile-menu-toggle"
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#2196F3',
              display: 'none'
            }}
            className="mobile-logo"
            >
              SUPFile
            </span>
          </div>

          {/* User info et logout - Mobile */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}
          className="mobile-user-info"
          >
            <span style={{ 
              fontSize: '13px',
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '120px'
            }}>
              {user.email.split('@')[0]}
            </span>
            <button 
              onClick={handleLogout} 
              style={{ 
                padding: '8px 12px', 
                backgroundColor: '#f44336', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '13px',
                minHeight: '36px',
                fontWeight: '500',
                transition: 'background-color 0.2s, transform 0.1s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d32f2f';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f44336';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {t('logout')}
            </button>
          </div>

          {/* Navigation desktop */}
          <div className="nav-links-desktop" style={{ 
            display: 'flex', 
            gap: '4px',
            flex: 1,
            justifyContent: 'center',
            margin: '0 24px'
          }}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  padding: '10px 16px',
                  textDecoration: 'none',
                  color: location.pathname === link.path ? '#2196F3' : '#666',
                  fontWeight: location.pathname === link.path ? '600' : '400',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '15px',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== link.path) {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.color = '#333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== link.path) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#666';
                  }
                }}
              >
                {link.label}
                {location.pathname === link.path && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
                    height: '3px',
                    backgroundColor: '#2196F3',
                    borderRadius: '3px 3px 0 0'
                  }} />
                )}
              </Link>
            ))}
          </div>

          {/* User info desktop */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px'
          }}
          className="desktop-user-info"
          >
            <span style={{ 
              fontSize: '14px',
              color: '#666',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
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
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '14px',
                minHeight: '36px',
                fontWeight: '500',
                transition: 'background-color 0.2s, transform 0.1s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#d32f2f';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f44336';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Menu mobile avec animation */}
        <div 
          className="nav-links-mobile"
          style={{
            display: mobileMenuOpen ? 'block' : 'none',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            padding: '8px 0',
            maxHeight: mobileMenuOpen ? '500px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out, padding 0.3s ease-out'
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '14px 20px',
                textDecoration: 'none',
                color: location.pathname === link.path ? '#2196F3' : '#333',
                fontWeight: location.pathname === link.path ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                minHeight: '48px',
                backgroundColor: location.pathname === link.path ? '#e3f2fd' : 'transparent',
                transition: 'background-color 0.2s',
                borderLeft: location.pathname === link.path ? '4px solid #2196F3' : '4px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== link.path) {
                  e.target.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== link.path) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
      <style>{`
        @media (max-width: 767px) {
          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .mobile-logo {
            display: block !important;
          }
          .mobile-user-info {
            display: flex !important;
          }
          .nav-links-desktop {
            display: none !important;
          }
          .desktop-user-info {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-menu-toggle {
            display: none !important;
          }
          .mobile-logo {
            display: none !important;
          }
          .mobile-user-info {
            display: none !important;
          }
          .nav-links-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

