import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e0e0e0',
      padding: '40px 20px 20px',
      marginTop: 'auto',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
      }}>
        {/* Contenu principal du footer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Section Logo et Description */}
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#2196F3',
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>
              SUPFile
            </div>
            <p style={{
              fontSize: '14px',
              color: '#666',
              lineHeight: '1.6',
              margin: 0
            }}>
              {t('footerDescription') || 'Votre solution de stockage cloud sécurisée et fiable. Stockez, partagez et gérez vos fichiers en toute simplicité.'}
            </p>
          </div>

          {/* Section Liens rapides */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '16px',
              marginTop: 0
            }}>
              {t('quickLinks') || 'Liens rapides'}
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <li>
                <Link to="/dashboard" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/files" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('files')}
                </Link>
              </li>
              <li>
                <Link to="/settings" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('settings')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Section Support */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '16px',
              marginTop: 0
            }}>
              {t('support') || 'Support'}
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <li>
                <a href="mailto:support@supfile.com" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('contactUs') || 'Nous contacter'}
                </a>
              </li>
              <li>
                <a href="#" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('help') || 'Aide'}
                </a>
              </li>
              <li>
                <a href="#" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('faq') || 'FAQ'}
                </a>
              </li>
            </ul>
          </div>

          {/* Section Légale */}
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '16px',
              marginTop: 0
            }}>
              {t('legal') || 'Légal'}
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <li>
                <a href="#" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('privacyPolicy') || 'Confidentialité'}
                </a>
              </li>
              <li>
                <a href="#" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('termsOfService') || 'Conditions d\'utilisation'}
                </a>
              </li>
              <li>
                <a href="#" style={{
                  fontSize: '14px',
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2196F3'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
                >
                  {t('cookies') || 'Cookies'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div style={{
          height: '1px',
          backgroundColor: '#e0e0e0',
          width: '100%'
        }} />

        {/* Copyright */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '14px',
          color: '#999'
        }}>
          <div>
            © {currentYear} SUPFile. {t('allRightsReserved') || 'Tous droits réservés.'}
          </div>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            <span>{t('madeWith') || 'Fait avec'} ❤️ {t('by') || 'par'} SUPFile</span>
          </div>
        </div>
      </div>

      {/* Styles responsive */}
      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          footer > div > div:last-child {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>
    </footer>
  );
}

