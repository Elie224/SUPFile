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
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 50%), radial-gradient(circle at bottom right, rgba(37,99,235,0.22), #020617)',
        color: '#e5e7eb',
      }}
    >
      {/* Barre de navigation simple */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 18,
              boxShadow: '0 10px 25px rgba(59,130,246,0.45)',
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>SUPFile</div>
            <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)' }}>
              Plateforme de stockage professionnel
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.6)',
              backgroundColor: 'transparent',
              color: '#e5e7eb',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              background:
                'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(34,197,94,0.5)',
            }}
          >
            Créer un compte
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 24px 32px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 880,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          {/* Bloc principal : discours commercial + étapes */}
          <section>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                borderRadius: 999,
                backgroundColor: 'rgba(15,23,42,0.7)',
                border: '1px solid rgba(148,163,184,0.4)',
                fontSize: 11,
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 14 }}>✨</span>
              <span>Solution clé en main pour vos fichiers d’entreprise</span>
            </div>

            <h1
              style={{
                fontSize: 34,
                lineHeight: 1.15,
                marginBottom: 12,
                color: '#f9fafb',
              }}
            >
              La plateforme simple et sûre
              <br />
              pour gérer tous vos documents.
            </h1>

            <p
              style={{
                fontSize: 15,
                color: 'rgba(209,213,219,0.9)',
                maxWidth: 580,
                marginBottom: 18,
              }}
            >
              SUPFile est une solution de stockage et de partage conçue pour un usage
              professionnel et commercial&nbsp;: centralisez vos fichiers, collaborez avec vos
              équipes et accédez à vos données partout, en toute sécurité.
            </p>

            {/* 3 points clés très synthétiques */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  padding: 10,
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.5)',
                  fontSize: 12,
                  color: 'rgba(209,213,219,0.95)',
                }}
              >
                🔐 Stockage sécurisé dans le cloud
              </div>
              <div
                style={{
                  padding: 10,
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.5)',
                  fontSize: 12,
                  color: 'rgba(209,213,219,0.95)',
                }}
              >
                🤝 Partage maîtrisé avec vos collaborateurs
              </div>
              <div
                style={{
                  padding: 10,
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.5)',
                  fontSize: 12,
                  color: 'rgba(209,213,219,0.95)',
                }}
              >
                📊 Vue claire sur votre activité et vos quotas
              </div>
            </div>

            {/* Étape actuelle en avant */}
            <div
              style={{
                padding: 16,
                borderRadius: 18,
                backgroundColor: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(148,163,184,0.4)',
                marginBottom: 18,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    backgroundColor: '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {step + 1}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.9)' }}>
                  Étape {step + 1} sur {slides.length}
                </span>
              </div>

              <h2
                style={{
                  fontSize: 18,
                  color: '#e5e7eb',
                  marginBottom: 6,
                }}
              >
                {current.title}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(209,213,219,0.9)',
                  marginBottom: 4,
                }}
              >
                <strong style={{ color: '#a5b4fc' }}>{current.subtitle}</strong>
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(156,163,175,0.95)',
                  marginBottom: 0,
                }}
              >
                {current.description}
              </p>
            </div>

            {/* Indicateurs de progression + boutons */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                {slides.map((s, index) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => setStep(index)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: 'none',
                      fontSize: 11,
                      cursor: 'pointer',
                      backgroundColor:
                        index === step ? 'rgba(56,189,248,0.22)' : 'rgba(15,23,42,0.7)',
                      color: index === step ? '#e0f2fe' : 'rgba(148,163,184,0.9)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor:
                        index === step ? 'rgba(56,189,248,0.8)' : 'rgba(30,64,175,0.6)',
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isFirst}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.6)',
                    backgroundColor: isFirst ? 'rgba(15,23,42,0.7)' : 'transparent',
                    color: isFirst ? 'rgba(75,85,99,0.9)' : '#e5e7eb',
                    fontSize: 13,
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
                    padding: '9px 20px',
                    borderRadius: 999,
                    border: 'none',
                    background:
                      'linear-gradient(135deg, #3b82f6, #6366f1)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 14px 30px rgba(37,99,235,0.6)',
                  }}
                >
                  {isLast ? 'Commencer avec SUPFile' : 'Suivant →'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

