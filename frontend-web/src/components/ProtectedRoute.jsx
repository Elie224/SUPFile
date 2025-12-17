import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}







