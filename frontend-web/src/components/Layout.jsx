import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { useLanguage } from '../contexts/LanguageContext';
import { dashboardService } from '../services/api';
import Logo from './Logo';
import Footer from './Footer';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setThemeState] = useState(() => typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light');

  const applyTheme = (value) => {
    const next = value || (theme === 'dark' ? 'light' : 'dark');
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  // GET /api/dashboard dès qu'on est sur /dashboard et qu'un token existe (ne pas attendre user du store)
  useEffect(() => {
    if (location.pathname !== '/dashboard') return;
    const token = localStorage.getItem('access_token');
    if (token) {
      dashboardService.getStats().catch(() => {});
    }
  }, [location.pathname]);

  // Appliquer le thème au montage (sync avec localStorage / autre onglet)
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'light';
    if (stored !== theme) setThemeState(stored);
    document.documentElement.setAttribute('data-theme', stored);
  }, []);

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
    ...(user?.is_admin ? [{ path: '/admin', label: '⚙️ Administration' }] : []),
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
        borderBottom: '1px solid var(--border-color)', 
        backgroundColor: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 'var(--nav-shadow)'
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
            <Link to="/dashboard" className="d-flex align-items-center gap-2" style={{ textDecoration: 'none' }}>
              <Logo size="small" className="mobile-logo" />
            </Link>
            {/* Logo Desktop (visible sur grand écran) */}
            <Link to="/dashboard" className="desktop-logo d-flex align-items-center" style={{ textDecoration: 'none' }}>
              <Logo size="small" style={{ height: '36px' }} />
            </Link>
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
                  color: location.pathname === link.path ? '#2196F3' : 'var(--text-secondary)',
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
                    e.target.style.backgroundColor = 'var(--bg-hover)';
                    e.target.style.color = 'var(--text-color)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== link.path) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
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

          {/* DROITE: Thème (desktop) + User Menu */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            position: 'relative',
            flex: '0 0 auto'
          }}
          className="user-menu-container"
          >
            {/* Interrupteur thème - visible desktop et mobile header */}
            <button
              type="button"
              onClick={() => applyTheme()}
              aria-label={theme === 'dark' ? (t('lightTheme') || 'Thème clair') : (t('darkTheme') || 'Thème sombre')}
              title={theme === 'dark' ? (t('lightTheme') || 'Thème clair') : (t('darkTheme') || 'Thème sombre')}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              className="layout-theme-toggle"
            >
              {theme === 'dark' ? <i className="bi bi-sun-fill" /> : <i className="bi bi-moon-fill" />}
            </button>
            {/* User Menu Mobile */}
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-secondary)',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-color)',
                fontWeight: '500',
                minHeight: '40px',
                transition: 'background-color 0.2s'
              }}
              className="mobile-user-button user-menu-button"
            >
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'https://supfile.fly.dev'}${user.avatar_url}`}
                  alt="Avatar"
                  style={{ 
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '8px'
                  }}
                  onError={(e) => {
                    const el = e.target;
                    if (el?.style) el.style.display = 'none';
                    const next = el?.nextSibling;
                    if (next?.style) next.style.display = 'inline-block';
                  }}
                />
              ) : null}
              <span style={{ 
                display: user.avatar_url ? 'none' : 'inline-block',
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
                {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
              </span>
              <span style={{ 
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.display_name || user.email.split('@')[0]}
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
                backgroundColor: 'var(--bg-secondary)',
                border: 'none',
                borderRadius: '24px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-color)',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              className="desktop-user-button user-menu-button"
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}
            >
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'https://supfile.fly.dev'}${user.avatar_url}`}
                  alt="Avatar"
                  style={{ 
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    const el = e.target;
                    if (el?.style) el.style.display = 'none';
                    const next = el?.nextSibling;
                    if (next?.style) next.style.display = 'inline-block';
                  }}
                />
              ) : null}
              <span style={{ 
                display: user.avatar_url ? 'none' : 'inline-block',
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
                {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
              </span>
              <span style={{ 
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.display_name || user.email.split('@')[0]}
              </span>
            </button>
            
            {/* Dropdown Menu Utilisateur amélioré */}
            {userMenuOpen && (
              <div className="user-menu-dropdown card shadow-lg" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                minWidth: '240px',
                zIndex: 1001,
                border: 'none',
                borderRadius: '12px'
              }}
              onClick={(e) => e.stopPropagation()}
              >
                <div className="card-body p-0">
                  {/* En-tête du menu */}
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'https://supfile.fly.dev'}${user.avatar_url}`}
                          alt="Avatar"
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const el = e.target;
                            if (el?.style) el.style.display = 'none';
                            const next = el?.nextSibling;
                            if (next?.style) next.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className="badge bg-primary rounded-circle" style={{ 
                        width: '40px', 
                        height: '40px', 
                        display: user.avatar_url ? 'none' : 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 600
                      }}>
                        {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate" style={{ fontSize: '14px', color: 'var(--text-color)' }}>
                          {user.display_name || user.email.split('@')[0]}
                        </div>
                        <div className="text-muted small text-truncate" style={{ fontSize: '12px' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options du menu */}
                  <div className="p-1">
                    <button
                      className="btn btn-link text-start w-100 d-flex align-items-center gap-2 text-danger"
                      style={{ 
                        textDecoration: 'none',
                        padding: '10px 16px',
                        fontSize: '14px',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      {t('logout') || 'Déconnexion'}
                    </button>
                  </div>
                </div>
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
          backgroundColor: 'var(--bg-color)',
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
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            {user.avatar_url ? (
              <img 
                src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL || 'https://supfile.fly.dev'}${user.avatar_url}`}
                alt="Avatar"
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  const el = e.target;
                  if (el?.style) el.style.display = 'none';
                  const next = el?.nextSibling;
                  if (next?.style) next.style.display = 'flex';
                }}
              />
            ) : null}
            <span style={{ 
              display: user.avatar_url ? 'none' : 'flex',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#2196F3',
              color: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
            </span>
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-color)'
              }}>
                {user.display_name || user.email.split('@')[0]}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* Thème - visible sur mobile dans le drawer */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '8px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 600 }}>
            {t('theme') || 'Thème'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => applyTheme('light')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: theme === 'light' ? '2px solid #2196F3' : '1px solid var(--border-color)',
                backgroundColor: theme === 'light' ? 'rgba(33, 150, 243, 0.15)' : 'var(--bg-secondary)',
                color: theme === 'light' ? '#2196F3' : 'var(--text-secondary)',
                fontWeight: theme === 'light' ? 600 : 400,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <i className="bi bi-sun-fill" style={{ fontSize: '18px' }} />
              <span>{t('lightTheme') || 'Clair'}</span>
            </button>
            <button
              type="button"
              onClick={() => applyTheme('dark')}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: theme === 'dark' ? '2px solid #2196F3' : '1px solid var(--border-color)',
                backgroundColor: theme === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'var(--bg-secondary)',
                color: theme === 'dark' ? '#2196F3' : 'var(--text-secondary)',
                fontWeight: theme === 'dark' ? 600 : 400,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <i className="bi bi-moon-fill" style={{ fontSize: '18px' }} />
              <span>{t('darkTheme') || 'Sombre'}</span>
            </button>
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
                color: location.pathname === link.path ? '#2196F3' : 'var(--text-color)',
                fontWeight: location.pathname === link.path ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minHeight: '52px',
                backgroundColor: location.pathname === link.path ? 'var(--bg-hover)' : 'transparent',
                transition: 'all 0.2s ease',
                borderLeft: location.pathname === link.path ? '4px solid #2196F3' : '4px solid transparent',
                fontSize: '16px',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              onTouchStart={(e) => {
                if (location.pathname !== link.path) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
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
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
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
                backgroundColor: location.pathname === link.path ? '#2196F3' : 'var(--border-color)',
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
          borderTop: '1px solid var(--border-color)',
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
        /* Styles par défaut - Desktop first */
        .mobile-user-button {
          display: none !important;
        }
        .desktop-user-button {
          display: flex !important;
        }
        
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
          .desktop-logo {
            display: none !important;
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
          .desktop-logo {
            display: flex !important;
          }
          .mobile-user-button {
            display: none !important;
          }
          .desktop-user-button {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
