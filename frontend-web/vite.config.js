import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'manifest.json'],
      manifest: {
        name: 'SUPFile - Cloud Storage',
        short_name: 'SUPFile',
        description: 'Plateforme de stockage cloud sécurisée pour vos fichiers. Fonctionne hors ligne.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#502A88',
        orientation: 'any',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['productivity', 'utilities']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Éviter les erreurs de lecture sur Windows/OneDrive (INCONNU : erreur inconnue, lecture)
    watch: {
      usePolling: true,
    },
    fs: {
      strict: false,
    },
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: 'dist',
    // Optimisations de build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en production
        drop_debugger: true,
      },
    },
    // Code splitting automatique
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          auth: ['./src/services/authStore'],
        },
      },
    },
    // Augmenter la limite de taille pour les warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimisations de développement
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
