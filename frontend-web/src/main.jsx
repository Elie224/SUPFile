import React, { useEffect, lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/authStore';
import { LanguageProvider } from './contexts/LanguageContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles.css';
import { ensureDownloadContainer } from './utils/downloadBlob';

// Conteneur de téléchargement créé avant tout rendu React pour éviter insertBefore pendant les clics
if (typeof document !== 'undefined') {
  const init = () => {
    try { ensureDownloadContainer(); } catch (_) {}
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

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
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'));
const LegalNotice = lazy(() => import('./pages/LegalNotice'));
// Import direct pour éviter page blanche au clic sur le lien de vérification email (chunk 404 après déploiement)
import VerifyEmail from './pages/VerifyEmail';

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

  useEffect(() => {
    // Masquer le fallback "Chargement..." dès que l'app React est montée (évite page blanche si JS charge lentement)
    document.getElementById('app-loading')?.remove();
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Appliquer le thème stocké (ou clair par défaut) une seule fois au démarrage.
    const storedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
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
        <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
        <Route path="/conditions-utilisation" element={<TermsOfUse />} />
        <Route path="/mentions-legales" element={<LegalNotice />} />
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
