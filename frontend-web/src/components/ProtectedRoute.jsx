import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

const HYDRATION_TIMEOUT_MS = 2500;

export default function ProtectedRoute({ children }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Si la réhydratation Zustand ne se déclenche pas (SW, cache), débloquer après 2,5 s et lire le storage
  useEffect(() => {
    if (hasHydrated) return;
    const t = setTimeout(() => {
      if (useAuthStore.getState()._hasHydrated) return;
      try {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state) {
            useAuthStore.setState({ _hasHydrated: true, ...parsed.state });
            return;
          }
        }
      } catch (_) {}
      useAuthStore.setState({ _hasHydrated: true });
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [hasHydrated]);

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








