import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authApi, usersApi } from '@/lib/api';

export interface User {
  id: string;
  tenantId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  branchId?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  staffLogin: (phone: string, password: string, tenantSlug?: string) => Promise<User>;
  superadminLogin: (phone: string, password: string) => Promise<User>;
  clientLogin: (phone: string, firstName?: string, lastName?: string) => Promise<User>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      staffLogin: async (phone, password, tenantSlug) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.staffLogin({ phone, password, tenantSlug });
          const { user, accessToken, refreshToken } = data.data;
          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });
          set({ user, isAuthenticated: true });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      clientLogin: async (phone, firstName, lastName) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.clientPhoneAuth({ phone, firstName, lastName });
          const { user, accessToken, refreshToken } = data.data ?? data;
          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });
          set({ user, isAuthenticated: true });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      superadminLogin: async (phone, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.superadminLogin({ phone, password });
          const { user, accessToken, refreshToken } = data.data;
          Cookies.set('accessToken', accessToken, { expires: 7 });
          Cookies.set('refreshToken', refreshToken, { expires: 30 });
          set({ user, isAuthenticated: true });
          return user;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const token = Cookies.get('accessToken');
        if (!token) return;
        try {
          const { data } = await usersApi.me();
          set({ user: data.data, isAuthenticated: true });
        } catch {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
