import React, { useEffect, useRef, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/authStore';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import syncService from './services/syncService';
import offlineDB from './services/offlineDB';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';

// Capturer les erreurs globales (promesses, window.onerror) pour diagnostic même si ErrorBoundary ne les voit pas
function captureGlobalError(payload) {
  try {
    if (typeof window !== 'undefined') {
      window.__SUPFILE_LAST_ERROR__ = payload;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('SUPFILE_LAST_ERROR', JSON.stringify(payload));
      }
    }
  } catch (_) {}
}
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    captureGlobalError({
      message: e.message,
      stack: e.error?.stack,
      filename: e.filename,
      lineno: e.lineno,
      timestamp: new Date().toISOString(),
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    captureGlobalError({
      message: reason?.message ?? String(reason),
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
    });
  });
}

// Imports directs pour les pages critiques (évite blocage/erreur si le chunk lazy ne charge pas après déploiement)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
// Lazy loading des autres pages
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const OAuthProxy = lazy(() => import('./pages/OAuthProxy'));
const Files = lazy(() => import('./pages/Files'));
const Settings = lazy(() => import('./pages/Settings'));
const Preview = lazy(() => import('./pages/Preview'));
const Share = lazy(() => import('./pages/Share'));
const Search = lazy(() => import('./pages/Search'));
const Trash = lazy(() => import('./pages/Trash'));
const Admin = lazy(() => import('./pages/Admin'));
const Intro = lazy(() => import('./pages/Intro'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
// Import direct pour éviter page blanche au clic sur le lien de vérification email (chunk 404 après déploiement)
import VerifyEmail from './pages/VerifyEmail';
const Offline = lazy(() => import('./pages/Offline'));

// Composant de chargement
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  }}>
    <div style={{ fontSize: '16px', color: '#666' }}>Chargement...</div>
  </div>
);

function App() {
  const { user, accessToken, initialize } = useAuthStore();
  const initialSyncDone = useRef(false);

  useEffect(() => {
    // Masquer le fallback "Chargement..." dès que l'app React est montée (évite page blanche si JS charge lentement)
    document.getElementById('app-loading')?.remove();
    initialize();
    // Initialiser IndexedDB
    offlineDB.init().catch(err => {
      console.error('[App] Erreur initialisation IndexedDB:', err);
    });
  }, [initialize]);

  // Sync initiale une seule fois par session quand user+token sont disponibles (évite rafale GET /api/folders)
  useEffect(() => {
    if (!navigator.onLine || !user || !accessToken) {
      if (!user) initialSyncDone.current = false;
      return;
    }
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;
    syncService.syncFromServer().catch(err => {
      console.error('[App] Erreur synchronisation initiale:', err);
    });
  }, [user, accessToken]);

  // Synchronisation automatique au retour de la connexion
  useEffect(() => {
    const handleOnline = () => {
      if (user && accessToken) {
        syncService.fullSync().catch(() => {});
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, accessToken]);

  useEffect(() => {
    // Appliquer le thème stocké (ou clair par défaut) une seule fois au démarrage.
    const storedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  // Enregistrement du Service Worker pour le mode hors ligne (PWA)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    // Préférer le plugin PWA s'il est disponible (build avec vite-plugin-pwa)
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({
          onOfflineReady() {},
          onNeedRefresh() {},
          onRegisterError(e) {
            console.warn('[PWA] Register error:', e);
          }
        });
      })
      .catch(() => {
        // Fallback : enregistrer le SW minimal (public/sw-fallback.js) si le plugin PWA n'est pas installé
        navigator.serviceWorker.register('/sw-fallback.js').catch(() => {});
      });
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <OfflineBanner />
          <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
        {/* /reset-password en premier : pas de redirection si connecté, pour que le lien email mène bien à la page */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/offline" element={<Offline />} />
        <Route path="/" element={<Intro />} />
        <Route path="/login" element={user && accessToken ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user && accessToken ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/forgot-password" element={user && accessToken ? <Navigate to="/dashboard" replace /> : <ForgotPassword />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        {/* Routes de proxy pour les callbacks OAuth directs depuis les providers */}
        <Route path="/auth/callback/google" element={<OAuthProxy provider="google" />} />
        <Route path="/auth/callback/github" element={<OAuthProxy provider="github" />} />
        <Route path="/share/:token" element={<Share />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/files"
          element={
            <Layout>
              <ProtectedRoute>
                <Files />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/admin"
          element={
            <Layout>
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/preview/:id"
          element={
            <Layout>
              <ProtectedRoute>
                <Preview />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/search"
          element={
            <Layout>
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/trash"
          element={
            <Layout>
              <ProtectedRoute>
                <Trash />
              </ProtectedRoute>
            </Layout>
          }
        />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
