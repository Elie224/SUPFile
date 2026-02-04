import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const from = `${location.pathname}${location.search}${location.hash}`;

  return (
    <footer style={{
      backgroundColor: 'var(--bg-color)',
      borderTop: '1px solid var(--border-color)',
      padding: '20px',
      marginTop: 'auto',
      width: '100%',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        fontSize: '14px',
        color: 'var(--text-muted)'
      }}>
        © {currentYear} SUPFile. Tous droits réservés.
        {' · '}
        <Link to="/politique-confidentialite" state={{ from }} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Politique de confidentialité
        </Link>
        {' · '}
        <Link to="/conditions-utilisation" state={{ from }} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Conditions d'utilisation
        </Link>
        {' · '}
        <Link to="/mentions-legales" state={{ from }} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Mentions légales
        </Link>
      </div>
    </footer>
  );
}

