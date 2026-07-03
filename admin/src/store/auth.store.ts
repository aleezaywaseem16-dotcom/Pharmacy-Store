import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        setAuthToken(accessToken);
        set({ user, accessToken });
      },
      clearAuth: () => {
        setAuthToken(null);
        set({ user: null, accessToken: null });
      },
      isAdmin: () => ['ADMIN', 'SUPER_ADMIN', 'PHARMACIST'].includes(get().user?.role ?? ''),
      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
    }),
    {
      name: 'pharmacy-admin-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAuthToken(state.accessToken);
      },
    },
  ),
);
