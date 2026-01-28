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

// Lazy loading des pages pour améliorer les performances
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const OAuthProxy = lazy(() => import('./pages/OAuthProxy'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Files = lazy(() => import('./pages/Files'));
const Settings = lazy(() => import('./pages/Settings'));
const Preview = lazy(() => import('./pages/Preview'));
const Share = lazy(() => import('./pages/Share'));
const Search = lazy(() => import('./pages/Search'));
const Trash = lazy(() => import('./pages/Trash'));
const Admin = lazy(() => import('./pages/Admin'));
const Intro = lazy(() => import('./pages/Intro'));

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
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Appliquer le thème stocké (ou clair par défaut)
    const storedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  useEffect(() => {
    // Quand l'utilisateur change (login / chargement), appliquer sa préférence si disponible
    if (!user) return;
    const preferredTheme = user.preferences?.theme || localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', preferredTheme);
    localStorage.setItem('theme', preferredTheme);
  }, [user]);

  // Enregistrer le Service Worker pour PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[Service Worker] Enregistré avec succès:', registration.scope);
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouveau service worker disponible
                  console.log('[Service Worker] Nouvelle version disponible');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[Service Worker] Erreur lors de l\'enregistrement:', error);
        });

      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[Service Worker] Message reçu:', event.data);
      });
    }
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
        <Route path="/" element={<Intro />} />
        <Route path="/login" element={user && accessToken ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user && accessToken ? <Navigate to="/dashboard" replace /> : <Signup />} />
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
