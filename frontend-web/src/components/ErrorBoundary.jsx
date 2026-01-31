// Error Boundary pour capturer les erreurs React
// Améliore la stabilité de l'application

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Envoyer l'erreur à un service de logging si disponible
    if (process.env.NODE_ENV === 'production') {
      // TODO: Envoyer à un service de logging (Sentry, LogRocket, etc.)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Recharger la page pour un reset complet
    window.location.reload();
  };

  render() {
    // Toujours afficher un fallback en cas d'erreur (dev + prod) pour éviter page blanche
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
        }}>
          <div style={{
            maxWidth: '480px',
            padding: '32px',
            borderRadius: '12px',
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
          }}>
            <h1 style={{ fontSize: '20px', color: '#f1f5f9', marginBottom: '12px' }}>
              Une erreur s'est produite
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
              Rechargez la page ou réessayez plus tard.
            </p>
            {isDev && this.state.error && (
              <details style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                maxHeight: '200px',
                overflow: 'auto',
                color: '#cbd5e1',
              }}>
                <summary style={{ cursor: 'pointer' }}>Détails (dev)</summary>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '8px' }}>
                  {this.state.error.toString()}
                </div>
              </details>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


