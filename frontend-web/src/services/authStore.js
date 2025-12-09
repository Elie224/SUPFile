// Store d'authentification - Zustand
import { create } from 'zustand';
import { authService } from './api';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isLoading: false,
  error: null,

  // Actions
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);
      const { access_token, refresh_token, user } = response.data;

      // Sauvegarder les tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      set({
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        isLoading: false,
      });

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup(email, password);
      const { access_token, refresh_token, user } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      set({
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
        isLoading: false,
      });

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Signup failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
