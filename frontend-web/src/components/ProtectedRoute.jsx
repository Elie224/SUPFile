import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

export default function ProtectedRoute({ children }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Attendre la réhydratation du store (localStorage) avant de rediriger,
  // pour permettre la navigation hors ligne avec la session stockée.
  if (!hasHydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <div style={{ fontSize: '16px', color: 'var(--text-secondary, #666)' }}>Chargement...</div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}








