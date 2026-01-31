import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';
import { LOGO_IMG } from '../config';

// Données des 5 pages d'introduction
const PAGES = [
  {
    id: 1,
    icon: '🚀',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    title: 'Bienvenue sur SUPFile',
    subtitle: 'Votre espace de stockage cloud professionnel',
    description: 'SUPFile est une plateforme moderne et sécurisée pour stocker, organiser et partager tous vos fichiers. Accessible depuis le web et le mobile, elle est conçue pour les professionnels exigeants.',
    highlights: ['Stockage cloud illimité', 'Sécurité renforcée', 'Accès multi-appareils'],
  },
  {
    id: 2,
    icon: '📁',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    title: 'Organisation intelligente',
    subtitle: 'Gérez vos fichiers comme un pro',
    description: 'Créez des dossiers et sous-dossiers pour organiser parfaitement vos documents. Utilisez le glisser-déposer pour déplacer vos fichiers et la corbeille pour récupérer ceux supprimés par erreur.',
    highlights: ['Dossiers illimités', 'Glisser-déposer', 'Corbeille avec restauration'],
  },
  {
    id: 3,
    icon: '👁️',
    gradient: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
    title: 'Prévisualisation instantanée',
    subtitle: 'Visualisez sans télécharger',
    description: 'Ouvrez vos fichiers directement dans l\'application : documents PDF, images, vidéos, fichiers audio et textes. Plus besoin de télécharger pour voir le contenu.',
    highlights: ['PDF, Word, Excel', 'Images et vidéos', 'Fichiers audio'],
  },
  {
    id: 4,
    icon: '🔗',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    title: 'Partage sécurisé',
    subtitle: 'Collaborez en toute confiance',
    description: 'Créez des liens de partage publics avec date d\'expiration ou protection par mot de passe. Partagez aussi en interne avec d\'autres utilisateurs SUPFile.',
    highlights: ['Liens temporaires', 'Protection par mot de passe', 'Partage entre utilisateurs'],
  },
  {
    id: 5,
    icon: '📊',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    title: 'Tableau de bord complet',
    subtitle: 'Gardez le contrôle total',
    description: 'Visualisez votre utilisation de stockage, accédez rapidement à vos fichiers récents et personnalisez votre expérience avec le thème clair ou sombre.',
    highlights: ['Statistiques détaillées', 'Gestion des quotas', 'Thèmes personnalisables'],
  },
];

export default function Intro() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  });

  // Redirection si connecté
  useEffect(() => {
    if (user && accessToken) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, accessToken, navigate]);

  // Appliquer le thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const page = PAGES[currentPage];
  const isFirst = currentPage === 0;
  const isLast = currentPage === PAGES.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate('/signup');
    } else {
      setCurrentPage((p) => p + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) {
      setCurrentPage((p) => p - 1);
    }
  };

  const goToPage = (index) => {
    setCurrentPage(index);
  };

  // Styles dynamiques
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
      transition: 'background-color 0.3s ease',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${theme === 'dark' ? 'rgba(71, 85, 105, 0.5)' : '#e2e8f0'}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    logoIcon: {
      width: '45px',
      height: '45px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '22px',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
    },
    logoText: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    themeToggle: {
      display: 'flex',
      backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
      borderRadius: '50px',
      padding: '4px',
      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
    },
    themeBtn: (isActive) => ({
      padding: '8px 16px',
      borderRadius: '50px',
      border: 'none',
      backgroundColor: isActive ? '#3b82f6' : 'transparent',
      color: isActive ? 'white' : (theme === 'dark' ? '#94a3b8' : '#64748b'),
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
    }),
    authBtns: {
      display: 'flex',
      gap: '12px',
    },
    btnLogin: {
      padding: '10px 20px',
      borderRadius: '10px',
      border: `1px solid ${theme === 'dark' ? '#475569' : '#cbd5e1'}`,
      backgroundColor: 'transparent',
      color: theme === 'dark' ? '#e2e8f0' : '#334155',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    btnSignup: {
      padding: '10px 20px',
      borderRadius: '10px',
      border: 'none',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: 'white',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
      transition: 'all 0.2s ease',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    },
    pageContainer: {
      width: '100%',
      maxWidth: '900px',
      textAlign: 'center',
    },
    pageNumber: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 20px',
      borderRadius: '50px',
      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6',
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '30px',
      border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
    },
    iconBox: {
      width: '120px',
      height: '120px',
      margin: '0 auto 30px',
      borderRadius: '30px',
      background: page.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '60px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
      animation: 'float 3s ease-in-out infinite',
    },
    title: {
      fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
      fontWeight: '800',
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
      marginBottom: '15px',
      lineHeight: '1.2',
    },
    subtitle: {
      fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
      fontWeight: '600',
      background: page.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '20px',
    },
    description: {
      fontSize: '1.1rem',
      color: theme === 'dark' ? '#94a3b8' : '#64748b',
      lineHeight: '1.8',
      maxWidth: '700px',
      margin: '0 auto 35px',
    },
    highlights: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '15px',
      marginBottom: '50px',
    },
    highlightItem: {
      padding: '12px 24px',
      borderRadius: '12px',
      backgroundColor: theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'white',
      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
      color: theme === 'dark' ? '#e2e8f0' : '#334155',
      fontSize: '15px',
      fontWeight: '500',
      boxShadow: theme === 'dark' ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    navigation: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '30px',
    },
    dots: {
      display: 'flex',
      gap: '12px',
    },
    dot: (isActive) => ({
      width: isActive ? '40px' : '12px',
      height: '12px',
      borderRadius: '20px',
      border: 'none',
      backgroundColor: isActive ? '#3b82f6' : (theme === 'dark' ? '#334155' : '#cbd5e1'),
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      padding: 0,
    }),
    navButtons: {
      display: 'flex',
      gap: '20px',
    },
    btnPrev: {
      padding: '14px 28px',
      borderRadius: '12px',
      border: `2px solid ${theme === 'dark' ? '#475569' : '#cbd5e1'}`,
      backgroundColor: 'transparent',
      color: theme === 'dark' ? '#e2e8f0' : '#475569',
      cursor: isFirst ? 'not-allowed' : 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      opacity: isFirst ? 0.5 : 1,
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    btnNext: {
      padding: '14px 32px',
      borderRadius: '12px',
      border: 'none',
      background: page.gradient,
      color: 'white',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    footer: {
      textAlign: 'center',
      padding: '20px',
      color: theme === 'dark' ? '#64748b' : '#94a3b8',
      fontSize: '14px',
      borderTop: `1px solid ${theme === 'dark' ? '#1e293b' : '#f1f5f9'}`,
    },
  };

  return (
    <div style={styles.container}>
      {/* Animation CSS + Responsive */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .page-content { animation: fadeIn 0.5s ease-out; }
          .btn-hover:hover { transform: translateY(-2px); }
          
          /* Responsive Mobile */
          @media (max-width: 767px) {
            .intro-header-wrapper {
              flex-wrap: wrap !important;
              padding: 12px 16px !important;
              gap: 12px !important;
            }
            .intro-theme-toggle-wrapper {
              display: none !important;
            }
            .intro-auth-btns-wrapper {
              gap: 8px !important;
            }
            .intro-auth-btns-wrapper button {
              padding: 8px 14px !important;
              font-size: 13px !important;
            }
            .intro-icon-box {
              width: 80px !important;
              height: 80px !important;
              font-size: 40px !important;
              border-radius: 20px !important;
            }
            .intro-highlights-wrapper {
              gap: 10px !important;
            }
            .intro-highlight-item {
              padding: 10px 16px !important;
              font-size: 13px !important;
            }
            .intro-nav-btns-wrapper {
              flex-direction: column !important;
              width: 100% !important;
              gap: 12px !important;
            }
            .intro-nav-btn {
              width: 100% !important;
              justify-content: center !important;
              padding: 14px 20px !important;
            }
            .intro-description {
              font-size: 0.95rem !important;
            }
          }
          
          @media (max-width: 575px) {
            .intro-logo-text {
              font-size: 1.2rem !important;
            }
            .intro-icon-box {
              width: 70px !important;
              height: 70px !important;
              font-size: 35px !important;
            }
          }
        `}
      </style>

      {/* Header */}
      <header style={styles.header} className="intro-header-wrapper">
        <div style={styles.logo}>
          <img src={LOGO_IMG} alt="SUPFile" style={{ height: '48px', width: 'auto', marginRight: '12px' }} />
          <span style={styles.logoText} className="intro-logo-text">SUPFile</span>
        </div>

        <div style={styles.headerRight}>
          {/* Theme toggle */}
          <div style={styles.themeToggle} className="intro-theme-toggle-wrapper">
            <button
              style={styles.themeBtn(theme === 'light')}
              onClick={() => setTheme('light')}
              className="btn-hover"
            >
              ☀️ Clair
            </button>
            <button
              style={styles.themeBtn(theme === 'dark')}
              onClick={() => setTheme('dark')}
              className="btn-hover"
            >
              🌙 Sombre
            </button>
          </div>

          {/* Auth buttons */}
          <div style={styles.authBtns} className="intro-auth-btns-wrapper">
            <button
              style={styles.btnLogin}
              onClick={() => navigate('/login')}
              className="btn-hover"
            >
              Se connecter
            </button>
            <button
              style={styles.btnSignup}
              onClick={() => navigate('/signup')}
              className="btn-hover"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.pageContainer} className="page-content" key={currentPage}>
          {/* Page indicator */}
          <div style={styles.pageNumber}>
            📄 Page {currentPage + 1} sur {PAGES.length}
          </div>

          {/* Icon */}
          <div style={styles.iconBox} className="intro-icon-box">{page.icon}</div>

          {/* Title */}
          <h1 style={styles.title}>{page.title}</h1>

          {/* Subtitle */}
          <p style={styles.subtitle}>{page.subtitle}</p>

          {/* Description */}
          <p style={styles.description} className="intro-description">{page.description}</p>

          {/* Highlights */}
          <div style={styles.highlights} className="intro-highlights-wrapper">
            {page.highlights.map((item, idx) => (
              <div key={idx} style={styles.highlightItem} className="intro-highlight-item">
                <span>✓</span> {item}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={styles.navigation}>
            {/* Dots */}
            <div style={styles.dots}>
              {PAGES.map((_, idx) => (
                <button
                  key={idx}
                  style={styles.dot(idx === currentPage)}
                  onClick={() => goToPage(idx)}
                  aria-label={`Page ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={styles.navButtons} className="intro-nav-btns-wrapper">
              <button
                style={styles.btnPrev}
                onClick={goPrev}
                disabled={isFirst}
                className="btn-hover intro-nav-btn"
              >
                ← Précédent
              </button>
              <button
                style={styles.btnNext}
                onClick={goNext}
                className="btn-hover intro-nav-btn"
              >
                {isLast ? '🚀 Commencer' : 'Suivant →'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        © {new Date().getFullYear()} SUPFile — Plateforme de stockage cloud sécurisée
      </footer>
    </div>
  );
}
