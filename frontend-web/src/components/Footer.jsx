import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #e0e0e0',
      padding: '20px',
      marginTop: 'auto',
      width: '100%',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        fontSize: '14px',
        color: '#999'
      }}>
        © {currentYear} SUPFile. Tous droits réservés.
      </div>
    </footer>
  );
}

