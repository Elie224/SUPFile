import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

// Contenu des slides d'introduction
const SLIDES = [
  {
    icon: '🚀',
    title: 'Bienvenue sur SUPFile',
    subtitle: 'Votre espace de stockage professionnel',
    description:
      'SUPFile est une plateforme moderne de stockage cloud conçue pour les professionnels. Centralisez vos fichiers, collaborez avec vos équipes et accédez à vos données en toute sécurité.',
    features: [
      { icon: '☁️', title: 'Cloud sécurisé', text: 'Stockage chiffré' },
      { icon: '📱', title: 'Multi-plateforme', text: 'Web et mobile' },
      { icon: '🔒', title: 'Confidentialité', text: 'Vos données privées' },
    ],
  },
  {
    icon: '📁',
    title: 'Organisation intuitive',
    subtitle: 'Dossiers, sous-dossiers et corbeille',
    description:
      'Créez une arborescence de dossiers personnalisée. Déplacez vos fichiers par glisser-déposer, renommez-les facilement et restaurez ceux supprimés depuis la corbeille.',
    features: [
      { icon: '📂', title: 'Hiérarchie', text: 'Dossiers imbriqués' },
      { icon: '🔄', title: 'Glisser-déposer', text: 'Organisation rapide' },
      { icon: '🗑️', title: 'Corbeille', text: 'Récupération facile' },
    ],
  },
  {
    icon: '👁️',
    title: 'Prévisualisation intégrée',
    subtitle: 'PDF, images, vidéos, audio, textes',
    description:
      'Visualisez directement vos fichiers sans les télécharger. Notre visionneuse supporte les documents PDF, les images, les vidéos, les fichiers audio et les textes.',
    features: [
      { icon: '📄', title: 'Documents', text: 'PDF, textes' },
      { icon: '🖼️', title: 'Médias', text: 'Images, vidéos' },
      { icon: '🎵', title: 'Audio', text: 'Lecteur intégré' },
    ],
  },
  {
    icon: '🔗',
    title: 'Partage sécurisé',
    subtitle: 'Liens publics et partage interne',
    description:
      'Partagez vos fichiers via des liens publics temporaires ou protégés par mot de passe. Collaborez avec vos collègues grâce au partage interne entre utilisateurs SUPFile.',
    features: [
      { icon: '🌐', title: 'Liens publics', text: 'Partage externe' },
      { icon: '🔐', title: 'Protection', text: 'Mot de passe' },
      { icon: '👥', title: 'Collaboration', text: 'Partage interne' },
    ],
  },
  {
    icon: '📊',
    title: 'Tableau de bord complet',
    subtitle: 'Statistiques, quotas et personnalisation',
    description:
      'Suivez votre utilisation avec des statistiques détaillées. Gérez votre espace de stockage et personnalisez votre expérience avec le thème clair ou sombre.',
    features: [
      { icon: '📈', title: 'Statistiques', text: 'Vue d\'ensemble' },
      { icon: '💾', title: 'Quotas', text: 'Gestion espace' },
      { icon: '🎨', title: 'Thèmes', text: 'Personnalisation' },
    ],
  },
];

export default function Intro() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  });

  // Redirection si déjà connecté
  useEffect(() => {
    if (user && accessToken) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, accessToken, navigate]);

  // Application du thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const slide = SLIDES[currentSlide];
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/signup');
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="intro-page">
      {/* Header */}
      <header className="intro-header">
        <div className="intro-logo">
          <div className="intro-logo-icon">S</div>
          <div>
            <div className="intro-logo-text">SUPFile</div>
            <div className="intro-logo-subtitle">Stockage professionnel</div>
          </div>
        </div>

        <div className="intro-header-actions">
          {/* Sélecteur de thème */}
          <div className="intro-theme-toggle">
            <button
              type="button"
              className={`intro-theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
              aria-label="Thème clair"
            >
              <span>☀️</span>
              <span>Clair</span>
            </button>
            <button
              type="button"
              className={`intro-theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              aria-label="Thème sombre"
            >
              <span>🌙</span>
              <span>Sombre</span>
            </button>
          </div>

          {/* Boutons d'authentification */}
          <div className="intro-auth-buttons">
            <button
              type="button"
              className="intro-btn-login"
              onClick={() => navigate('/login')}
            >
              Se connecter
            </button>
            <button
              type="button"
              className="intro-btn-signup"
              onClick={() => navigate('/signup')}
            >
              Créer un compte
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="intro-main">
        <div className="intro-slide" key={currentSlide}>
          {/* Badge */}
          <div className="intro-badge">
            <span>✨</span>
            <span>Étape {currentSlide + 1} sur {SLIDES.length}</span>
          </div>

          {/* Icône du slide */}
          <div className="intro-slide-icon">{slide.icon}</div>

          {/* Titre */}
          <h1 className="intro-slide-title">{slide.title}</h1>

          {/* Sous-titre */}
          <p className="intro-slide-subtitle">{slide.subtitle}</p>

          {/* Description */}
          <p className="intro-slide-description">{slide.description}</p>

          {/* Features */}
          <div className="intro-features">
            {slide.features.map((feature, index) => (
              <div key={index} className="intro-feature-card">
                <div className="intro-feature-icon">{feature.icon}</div>
                <div className="intro-feature-title">{feature.title}</div>
                <div className="intro-feature-text">{feature.text}</div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="intro-navigation">
            {/* Indicateurs */}
            <div className="intro-dots">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`intro-dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Boutons de navigation */}
            <div className="intro-nav-buttons">
              <button
                type="button"
                className="intro-btn-prev"
                onClick={handlePrev}
                disabled={isFirst}
              >
                ← Précédent
              </button>
              <button
                type="button"
                className="intro-btn-next"
                onClick={handleNext}
              >
                {isLast ? 'Commencer maintenant' : 'Suivant →'}
              </button>
            </div>

            {/* Compteur */}
            <div className="intro-step-counter">
              Slide {currentSlide + 1} / {SLIDES.length}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="intro-footer">
        SUPFile © {new Date().getFullYear()} — Stockage cloud sécurisé pour professionnels
      </footer>
    </div>
  );
}
