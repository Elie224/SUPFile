import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

export default function Intro() {
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Si déjà connecté, on ne reste pas sur l'intro
    if (user && accessToken) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, accessToken, navigate]);

  const slides = [
    {
      title: 'Bienvenue sur SUPFile',
      subtitle: 'Votre espace sécurisé pour tous vos fichiers',
      description:
        'SUPFile vous permet de stocker, organiser et partager facilement vos documents, photos, vidéos et plus encore, depuis le web et le mobile.',
    },
    {
      title: 'Gérez vos fichiers simplement',
      subtitle: 'Dossiers, sous-dossiers et corbeille intelligente',
      description:
        'Créez des dossiers, renommez, déplacez par glisser-déposer, supprimez puis restaurez depuis la corbeille. Tout est pensé pour rester organisé.',
    },
    {
      title: 'Prévisualisez sans télécharger',
      subtitle: 'PDF, images, vidéos, audio, textes…',
      description:
        'Visualisez directement vos fichiers dans l’application : visionneuse PDF, lecteur vidéo/audio, galerie d’images et aperçu des textes.',
    },
    {
      title: 'Partagez en toute sécurité',
      subtitle: 'Liens publics et partage interne',
      description:
        'Générez des liens publics temporaires ou protégés par mot de passe, et partagez des dossiers avec d’autres utilisateurs SUPFile.',
    },
    {
      title: 'Gardez le contrôle',
      subtitle: 'Dashboard, quotas et paramètres',
      description:
        'Surveillez votre espace utilisé, accédez rapidement aux derniers fichiers et personnalisez votre expérience (avatar, langue, thème clair/sombre).',
    },
  ];

  const current = slides[step];
  const isFirst = step === 0;
  const isLast = step === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/signup');
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (isFirst) return;
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = () => {
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at top, rgba(37,99,235,0.14), transparent 55%), radial-gradient(circle at bottom, rgba(16,185,129,0.12), transparent 55%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
          gap: 40,
          alignItems: 'center',
        }}
      >
        {/* Colonne gauche : texte */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              borderRadius: 999,
              backgroundColor: 'rgba(37,99,235,0.08)',
              color: '#1D4ED8',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 16 }}>📁</span>
            <span>Plateforme cloud sécurisée</span>
          </div>

          <h1
            style={{
              fontSize: 32,
              lineHeight: 1.2,
              marginBottom: 12,
              color: 'var(--text-color)',
            }}
          >
            {current.title}
          </h1>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 12,
              color: 'var(--text-secondary)',
            }}
          >
            {current.subtitle}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              marginBottom: 24,
              maxWidth: 520,
            }}
          >
            {current.description}
          </p>

          {/* Indicateurs de progression */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {slides.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: index === step ? 32 : 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: index === step ? '#2563EB' : 'rgba(148,163,184,0.5)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Étape {step + 1} sur {slides.length}
            </span>
          </div>

          {/* Boutons d’action */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.7)',
                backgroundColor: isFirst ? 'rgba(248,250,252,0.8)' : 'transparent',
                color: isFirst ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: 14,
                cursor: isFirst ? 'not-allowed' : 'pointer',
                opacity: isFirst ? 0.7 : 1,
              }}
            >
              ← Précédent
            </button>
            <button
              type="button"
              onClick={handleNext}
              style={{
                padding: '10px 22px',
                borderRadius: 999,
                border: 'none',
                backgroundColor: '#2563EB',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(37,99,235,0.25)',
              }}
            >
              {isLast ? 'Créer mon compte' : 'Suivant →'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              J’ai déjà un compte
            </button>
          </div>
        </div>

        {/* Colonne droite : illustration simple */}
        <div
          style={{
            borderRadius: 24,
            backgroundColor: 'var(--bg-color)',
            boxShadow: '0 18px 45px rgba(15,23,42,0.16)',
            padding: 24,
            border: '1px solid rgba(148,163,184,0.35)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background:
                  'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(59,130,246,0.18))',
                color: '#1D4ED8',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              📂 Organisation
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,23,42,0.8)' }}>
                Dossiers, sous-dossiers, corbeille
              </div>
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background:
                  'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(45,212,191,0.18))',
                color: '#059669',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              🔒 Sécurité
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,23,42,0.8)' }}>
                Authentification & quotas
              </div>
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background:
                  'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(251,146,60,0.18))',
                color: '#C05621',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              🤝 Partage
              <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(15,23,42,0.8)' }}>
                Liens publics & internes
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 18,
              border: '1px dashed rgba(148,163,184,0.8)',
              padding: 16,
              marginBottom: 12,
              backgroundColor: 'rgba(15,23,42,0.02)',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 4,
                color: 'var(--text-color)',
              }}
            >
              Ce que vous allez pouvoir faire :
            </div>
            <ul
              style={{
                paddingLeft: 18,
                margin: 0,
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              <li>Téléverser et organiser vos fichiers</li>
              <li>Prévisualiser sans télécharger</li>
              <li>Partager avec vos collaborateurs ou en public</li>
              <li>Suivre votre activité et votre espace disque</li>
            </ul>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 12,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span>Conçu pour le web et le mobile 📱💻</span>
            <span>SUPFile • Stockage sécurisé</span>
          </div>
        </div>
      </div>
    </div>
  );
}

