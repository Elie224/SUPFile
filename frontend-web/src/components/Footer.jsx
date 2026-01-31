import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
        <Link to="/offline" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Mode hors ligne
        </Link>
      </div>
    </footer>
  );
}

