import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar?: string;
  discordTag?: string;
  pnwNationId?: number;
  pnwNationName?: string;
  createdAt: string;
  lastLogin?: string;
  timezone?: string;
  language: string;
  preferences?: any;
  systemAdmin?: {
    level: string;
    permissions: any;
    isActive: boolean;
  };
  allianceManagers: {
    id: string;
    role: string;
    title?: string;
    permissions: any;
    assignedAt: string;
    alliance: {
      id: string;
      allianceName: string;
      acronym?: string;
      routeSlug: string;
      displayName?: string;
      logoUrl?: string;
    };
  }[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  clearError: () => void;
  fetchUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: true, error: null });
      },

      setToken: (token: string) => {
        set({ token });
        // Set axios default header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      logout: async () => {
        const { token } = get();

        try {
          // Call logout endpoint if token exists
          if (token) {
            await api.post('/auth/logout');
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state regardless of API call result
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
          // Clear axios header
          delete api.defaults.headers.common['Authorization'];
        }
      },

      clearError: () => {
        set({ error: null });
      },

      fetchUser: async () => {
        const { token } = get();

        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Set axios header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const response = await api.get('/auth/me');

          if (response.data.success && response.data.user) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error('Invalid user data received');
          }
        } catch (error: any) {
          console.error('Fetch user error:', error);

          // If unauthorized, clear token and redirect to login
          if (error.response?.status === 401) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired',
            });
            delete api.defaults.headers.common['Authorization'];
          } else {
            set({
              isLoading: false,
              error: error.response?.data?.error || 'Failed to fetch user data',
            });
          }
        }
      },

      refreshToken: async (): Promise<boolean> => {
        const { token } = get();

        if (!token) {
          return false;
        }

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.post('/auth/refresh');

          if (response.data.success && response.data.token) {
            const newToken = response.data.token;
            set({ token: newToken });
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            return true;
          }

          return false;
        } catch (error) {
          console.error('Token refresh error:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
      onRehydrate: (state) => {
        // Initialize axios header if token exists
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }

        // Fetch user data on app start
        if (state?.token) {
          state.fetchUser?.();
        } else {
          state?.setToken && state.setToken('');
          state && (state.isLoading = false);
        }
      },
    }
  )
);

// Setup axios interceptors for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, logout } = useAuthStore.getState();
      const refreshSuccess = await refreshToken();

      if (refreshSuccess) {
        // Retry the original request with new token
        return api(originalRequest);
      } else {
        // Refresh failed, logout user
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);