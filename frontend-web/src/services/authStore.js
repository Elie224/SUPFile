import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, userService } from './api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null,
      /** Mis à true quand le store a été rehydraté depuis le localStorage (permet la nav hors ligne). */
      _hasHydrated: false,

      // Inscription (après succès, l'utilisateur doit vérifier son email avant de se connecter)
      signup: async (email, password, first_name, last_name, country) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.signup(email, password, first_name, last_name, country);
          set({ loading: false, error: null });
          const message = response.data?.message || 'Compte créé. Vérifiez votre email pour activer votre compte.';
          return { success: true, requiresVerification: true, message };
        } catch (err) {
          const errorMessage = err.response?.data?.error?.message || err.message || 'L\'inscription a échoué';
          const is409 = err.response?.status === 409;
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage, emailAlreadyUsed: !!is409 };
        }
      },

      // Connexion
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await authService.login(email, password);
          
          // Vérifier si le 2FA est requis
          if (response.data.data.requires_2fa) {
            set({ loading: false });
            return { 
              success: false, 
              requires_2fa: true,
              user_id: response.data.data.user_id,
              email: response.data.data.email
            };
          }
          
          const { user, access_token, refresh_token } = response.data.data;
          
          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            loading: false,
            error: null,
          });

          // Sauvegarder les tokens dans localStorage
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          return { success: true };
        } catch (err) {
          const errorMessage = err.response?.data?.error?.message || err.message || 'La connexion a échoué';
          const emailNotVerified = err.response?.status === 403 && err.response?.data?.error?.code === 'EMAIL_NOT_VERIFIED';
          set({ loading: false, error: errorMessage });
          return { success: false, error: errorMessage, emailNotVerified: !!emailNotVerified };
        }
      },

      // Déconnexion
      logout: async () => {
        const { refreshToken } = get();
        
        // Appeler l'API de déconnexion si on a un refresh token
        if (refreshToken) {
          try {
            await authService.logout(refreshToken);
          } catch (err) {
            console.error('Logout error:', err);
          }
        }

        // Nettoyer le state et localStorage
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
        });

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },

      // Mettre à jour les informations utilisateur
      setUser: (userData) => {
        set({ user: userData });
      },

      // Définir les tokens (pour OAuth callback)
      setTokens: async (accessToken, refreshToken) => {
        set({
          accessToken,
          refreshToken,
        });
        
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        // Récupérer les infos utilisateur
        try {
          const response = await userService.getMe();
          set({ user: response.data.data });
        } catch (err) {
          console.error('Failed to fetch user info after OAuth:', err);
        }
      },

      // Initialiser depuis localStorage
      initialize: () => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (accessToken && refreshToken) {
          // Les tokens sont déjà dans le state grâce à persist
          // On peut essayer de récupérer les infos utilisateur
          set({ accessToken, refreshToken });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state, err) => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export { useAuthStore };



