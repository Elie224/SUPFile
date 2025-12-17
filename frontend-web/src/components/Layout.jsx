import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from './Footer';

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

  // Fermer le menu mobile quand on clique sur l'overlay
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && !e.target.closest('.mobile-menu-drawer') && !e.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
      }
      if (userMenuOpen && !e.target.closest('.user-menu-dropdown') && !e.target.closest('.user-menu-button')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileMenuOpen, userMenuOpen]);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      {/* En-tête principal */}
      <nav style={{ 
        padding: '0',
        borderBottom: '1px solid #e0e0e0', 
        backgroundColor: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 16px',
          height: '64px',
          minHeight: '64px'
        }}>
          {/* GAUCHE: Hamburger + Logo (Mobile) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            flex: '0 0 auto'
          }}>
            {/* Menu Hamburger - TRÈS VISIBLE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                padding: '0',
                backgroundColor: '#2196F3',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '28px',
                width: '48px',
                height: '48px',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                boxShadow: '0 3px 6px rgba(33, 150, 243, 0.4)',
                fontWeight: 'bold',
                lineHeight: '48px',
                textAlign: 'center'
              }}
              className="mobile-menu-toggle"
              aria-label="Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
            
            {/* Logo Mobile */}
            <span style={{ 
              fontSize: '22px', 
              fontWeight: '700', 
              color: '#2196F3',
              letterSpacing: '-0.5px'
            }}
            className="mobile-logo"
            >
              SUPFile
            </span>
          </div>

          {/* CENTRE: Navigation Desktop */}
          <div className="nav-links-desktop" style={{ 
            display: 'flex', 
            gap: '8px',
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

          {/* DROITE: User Menu */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            position: 'relative',
            flex: '0 0 auto'
          }}
          className="user-menu-container"
          >
            {/* User Menu Mobile */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                fontWeight: '500',
                minHeight: '40px',
                transition: 'background-color 0.2s'
              }}
              className="mobile-user-button user-menu-button"
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
                marginRight: '8px'
              }}>
                {user.email.charAt(0).toUpperCase()}
              </span>
              <span style={{ 
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email.split('@')[0]}
              </span>
            </button>

            {/* User Menu Desktop */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                backgroundColor: '#f5f5f5',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#333',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              className="desktop-user-button user-menu-button"
              onMouseEnter={(e) => e.target.style.backgroundColor = '#eeeeee'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f5'}
            >
              <span style={{ 
                display: 'inline-block',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#2196F3',
                color: 'white',
                lineHeight: '32px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {user.email.charAt(0).toUpperCase()}
              </span>
              <span style={{ 
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.email}
              </span>
            </button>
            
            {/* Dropdown Menu Utilisateur */}
            {userMenuOpen && (
              <div className="user-menu-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '240px',
                zIndex: 1001,
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
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
                    padding: '14px 16px',
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
      </nav>

      {/* Drawer Menu Mobile - S'ouvre depuis la gauche */}
      <div 
        className="mobile-menu-drawer"
        style={{
          position: 'fixed',
          top: 0,
          left: mobileMenuOpen ? '0' : '-280px',
          width: '280px',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 1002,
          transition: 'left 0.3s ease-out',
          overflowY: 'auto',
          paddingTop: '64px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du drawer */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e0e0e0',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#2196F3',
            marginBottom: '8px'
          }}>
            SUPFile
          </div>
          <div style={{
            fontSize: '13px',
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user.email}
          </div>
        </div>

        {/* Navigation Links - ALIGNÉS À GAUCHE */}
        <div style={{ padding: '8px 0' }}>
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
              onTouchStart={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onTouchEnd={(e) => {
                if (location.pathname !== link.path) {
                  setTimeout(() => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }, 200);
                }
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: location.pathname === link.path ? '#2196F3' : '#ddd',
                marginRight: '16px',
                flexShrink: 0
              }}></span>
              <span style={{ flex: 1 }}>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Bouton Déconnexion dans le drawer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          marginTop: 'auto'
        }}>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
          >
            {t('logout')}
          </button>
        </div>
      </div>

      {/* Overlay sombre quand le menu est ouvert */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          onTouchStart={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1001,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Contenu principal */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* Footer */}
      <Footer />

      <style>{`
        /* Mobile styles */
        @media (max-width: 767px) {
          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .mobile-logo {
            display: block !important;
          }
          .mobile-user-button {
            display: flex !important;
            align-items: center;
          }
          .nav-links-desktop {
            display: none !important;
          }
          .desktop-user-button {
            display: none !important;
          }
          .mobile-menu-drawer {
            display: block !important;
          }
        }
        /* Desktop styles */
        @media (min-width: 768px) {
          .mobile-menu-toggle {
            display: none !important;
          }
          .mobile-logo {
            display: none !important;
          }
          .mobile-user-button {
            display: none !important;
          }
          .mobile-menu-drawer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
