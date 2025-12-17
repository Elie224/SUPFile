import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fermer les menus quand on change de page
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

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
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        {/* Header principal - Mobile */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 16px',
          height: '56px',
          minHeight: '56px'
        }}
        className="nav-header"
        >
          {/* Gauche: Menu + Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            flex: '0 0 auto'
          }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                padding: '0',
                backgroundColor: '#2196F3',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '24px',
                width: '44px',
                height: '44px',
                color: '#ffffff',
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)',
                fontWeight: 'bold',
                lineHeight: '44px',
                textAlign: 'center'
              }}
              className="mobile-menu-toggle"
              aria-label="Menu"
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1976D2';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2196F3';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 2px 4px rgba(33, 150, 243, 0.3)';
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#2196F3',
                display: 'none',
                letterSpacing: '-0.5px'
              }}
              className="mobile-logo"
              >
                SUPFile
              </span>
            </div>
          </div>

          {/* Droite: User menu - Mobile */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            position: 'relative'
          }}
          className="mobile-user-info"
          >
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'none',
                padding: '6px 10px',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#333',
                fontWeight: '500',
                minHeight: '32px',
                transition: 'background-color 0.2s'
              }}
              className="mobile-user-button"
            >
              <span style={{ 
                display: 'inline-block',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                color: 'white',
                lineHeight: '24px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                marginRight: '6px'
              }}>
                {user.email.charAt(0).toUpperCase()}
              </span>
              <span style={{ 
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email.split('@')[0]}
              </span>
            </button>
            
            {/* Menu utilisateur déroulant */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '200px',
                zIndex: 1001,
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#f44336',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {t('logout')}
                </button>
              </div>
            )}
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
            gap: '12px',
            position: 'relative'
          }}
          className="desktop-user-info"
          >
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#eeeeee'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f5'}
            >
              <span style={{ 
                display: 'inline-block',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                color: 'white',
                lineHeight: '28px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {user.email.charAt(0).toUpperCase()}
              </span>
              <span style={{ 
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email}
              </span>
            </button>
            
            {/* Menu utilisateur desktop */}
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '220px',
                zIndex: 1001,
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#f44336',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu mobile avec animation */}
        <div 
          className="nav-links-mobile"
          style={{
            display: mobileMenuOpen ? 'block' : 'none',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            padding: mobileMenuOpen ? '12px 0' : '0',
            maxHeight: mobileMenuOpen ? '500px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out, padding 0.3s ease-out',
            boxShadow: mobileMenuOpen ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '16px 20px',
                textDecoration: 'none',
                color: location.pathname === link.path ? '#2196F3' : '#333',
                fontWeight: location.pathname === link.path ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minHeight: '52px',
                backgroundColor: location.pathname === link.path ? '#e3f2fd' : 'transparent',
                transition: 'all 0.2s ease',
                borderLeft: location.pathname === link.path ? '4px solid #2196F3' : '4px solid transparent',
                fontSize: '16px',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== link.path) {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.paddingLeft = '24px';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== link.path) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.paddingLeft = '20px';
                }
              }}
            >
              <span style={{ 
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: location.pathname === link.path ? '#2196F3' : '#ccc',
                marginRight: '12px',
                flexShrink: 0
              }}></span>
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
          .mobile-user-button {
            display: flex !important;
            align-items: center;
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
          .mobile-user-button {
            display: none !important;
          }
          .nav-links-mobile {
            display: none !important;
          }
        }
        /* Fermer le menu utilisateur quand on clique ailleurs */
        body {
          position: relative;
        }
      `}</style>
      {/* Overlay pour fermer le menu utilisateur */}
      {userMenuOpen && (
        <div
          onClick={() => setUserMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: 'transparent'
          }}
        />
      )}
    </div>
  );
}

