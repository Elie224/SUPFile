import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

/**
 * Page affichée lorsque l'utilisateur est hors ligne et tente d'accéder à une ressource non mise en cache.
 */
export default function Offline() {
  return (
    <div
      className="auth-page-background"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          maxWidth: 420,
          padding: 32,
          backgroundColor: 'var(--bg-color)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Logo size="large" style={{ maxWidth: 80, marginBottom: 16 }} />
          <div
            style={{
              width: 80,
              height: 80,
              margin: '0 auto 16px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40
            }}
          >
            📡
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: 8 }}>
            Mode hors ligne
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.5 }}>
            Vous n'êtes pas connecté à Internet. L'application SUPFile reste utilisable pour la navigation 
            et les paramètres déjà chargés.
          </p>
        </div>

        <div
          style={{
            textAlign: 'left',
            padding: 16,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 12,
            marginBottom: 24,
            fontSize: 14,
            color: 'var(--text-secondary)'
          }}
        >
          <p style={{ marginBottom: 8, fontWeight: 600, color: 'var(--text-color)' }}>Sans connexion :</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Navigation entre les pages déjà visitées</li>
            <li>Consultation des paramètres et préférences</li>
            <li>Interface et thème</li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0, fontWeight: 600, color: 'var(--text-color)' }}>Nécessite Internet :</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>Connexion / Inscription</li>
            <li>Upload et téléchargement de fichiers</li>
            <li>Recherche et synchronisation des données</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600
            }}
          >
            Réessayer la connexion
          </button>
          <Link
            to="/"
            style={{
              padding: '12px 24px',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 500
            }}
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
