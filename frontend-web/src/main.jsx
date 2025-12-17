import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/authStore';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OAuthCallback from './pages/OAuthCallback';
import OAuthProxy from './pages/OAuthProxy';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Settings from './pages/Settings';
import Preview from './pages/Preview';
import Share from './pages/Share';
import Search from './pages/Search';
import Trash from './pages/Trash';
import './styles.css';

function App() {
  const { user, accessToken, initialize } = useAuthStore();

  // Forcer le thème clair
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Toujours forcer le thème clair
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }, [user]);

  return (
    <LanguageProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
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
        <Route path="/" element={<Navigate to={user && accessToken ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
