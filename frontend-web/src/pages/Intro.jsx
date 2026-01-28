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
            maxWidth: 1120,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {/* Colonne gauche : discours commercial */}
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
                fontSize: 36,
                lineHeight: 1.15,
                marginBottom: 10,
                color: '#f9fafb',
              }}
            >
              Centralisez, sécurisez et partagez
              <br />
              <span style={{ color: '#38bdf8' }}>tous vos documents</span>.
            </h1>

            <p
              style={{
                fontSize: 15,
                color: 'rgba(209,213,219,0.9)',
                maxWidth: 540,
                marginBottom: 20,
              }}
            >
              SUPFile est une plateforme professionnelle de gestion de fichiers pour les équipes
              modernes&nbsp;: stockage sécurisé, collaboration fluide et accès unifié depuis le web
              et le mobile.
            </p>

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

          {/* Colonne droite : visuel produit / points clés */}
          <section
            style={{
              background:
                'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))',
              borderRadius: 28,
              padding: 22,
              border: '1px solid rgba(30,64,175,0.8)',
              boxShadow: '0 24px 60px rgba(15,23,42,0.9)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(148,163,184,0.9)',
                    marginBottom: 4,
                  }}
                >
                  Vue d’ensemble (exemple de démonstration)
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#e5e7eb' }}>
                  Exemple de dashboard SUPFile
                </div>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  backgroundColor: 'rgba(16,185,129,0.16)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16,185,129,0.5)',
                }}
              >
                Données fictives • Sécurisé • Haute dispo
              </span>
            </div>

            {/* Faux aperçu de dashboard */}
            <div
              style={{
                borderRadius: 18,
                background:
                  'radial-gradient(circle at top, rgba(37,99,235,0.4), transparent 55%), rgba(15,23,42,0.98)',
                padding: 16,
                marginBottom: 16,
                border: '1px solid rgba(30,64,175,0.8)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(56,189,248,0.6)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(148,163,184,0.95)',
                      marginBottom: 4,
                    }}
                  >
                    Espace utilisé (exemple)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#e0f2fe' }}>
                    120,4 Go
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)' }}>
                    sur 500 Go alloués (démonstration)
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(251,191,36,0.6)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(148,163,184,0.95)',
                      marginBottom: 4,
                    }}
                  >
                    Fichiers partagés (exemple)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#facc15' }}>
                    243
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)' }}>
                    liens actifs & internes (démo)
                  </div>
                </div>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(52,211,153,0.6)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(148,163,184,0.95)',
                      marginBottom: 4,
                    }}
                  >
                    Activité récente (exemple)
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#6ee7b7' }}>
                    +37
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.9)' }}>
                    fichiers ajoutés cette semaine
                  </div>
                </div>
              </div>

              {/* Lignes de fichiers */}
              <div
                style={{
                  borderRadius: 12,
                  backgroundColor: 'rgba(15,23,42,0.9)',
                  padding: 10,
                  border: '1px solid rgba(30,64,175,0.7)',
                }}
              >
                {['Contrat_client.pdf', 'Présentation_commerciale.pptx', 'Rapport_financier.xlsx'].map(
                  (file, idx) => (
                    <div
                      key={file}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 8px',
                        borderRadius: 8,
                        backgroundColor:
                          idx === 0 ? 'rgba(30,64,175,0.7)' : 'transparent',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: '#e5e7eb',
                        }}
                      >
                        <span>📄</span>
                        <span>{file}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 11,
                          color: 'rgba(148,163,184,0.9)',
                        }}
                      >
                        <span>{idx === 0 ? '2,4 Mo' : idx === 1 ? '18,9 Mo' : '4,1 Mo'}</span>
                        <span>•</span>
                        <span>{idx === 0 ? 'Modifié il y a 2 h' : 'Hier'}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Points clés */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(209,213,219,0.9)' }}>
                ✅ Sauvegarde sur infrastructure cloud performante
                <br />
                ✅ Rôles administrateurs & quotas par utilisateur
              </div>
              <div style={{ fontSize: 12, color: 'rgba(209,213,219,0.9)' }}>
                ✅ Accès depuis le web et l’application mobile
                <br />
                ✅ Conçu pour un usage professionnel et commercial
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

