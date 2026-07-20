import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Role } from '@/types';
import { baseApi } from '@/lib/api';

const createSafeStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  
  hasRole: (roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isProctor: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (data) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setUser: (user) => set({ user }),

      logout: async () => {
        const token = get().accessToken;
        if (token) {
          try { await baseApi.post('/auth/logout'); } catch { }
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      hasRole: (roles) => {
        const user = get().user;
        return user ? roles.includes(user.role) : false;
      },

      isAdmin: () => get().hasRole(['ADMIN']),
      isProctor: () => get().hasRole(['PROCTOR', 'ADMIN']),
      isStudent: () => get().hasRole(['STUDENT']),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(createSafeStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);