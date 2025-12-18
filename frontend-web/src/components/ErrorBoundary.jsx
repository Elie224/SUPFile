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
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{ fontSize: '24px', color: '#d32f2f', marginBottom: '16px' }}>
              ⚠️ Une erreur s'est produite
            </h1>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
              Désolé, une erreur inattendue s'est produite. Veuillez réessayer.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                maxHeight: '300px',
                overflow: 'auto',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 'bold' }}>
                  Détails de l'erreur (développement uniquement)
                </summary>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <div style={{ marginTop: '12px' }}>
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}
            
            <button
              onClick={this.handleReset}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
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

