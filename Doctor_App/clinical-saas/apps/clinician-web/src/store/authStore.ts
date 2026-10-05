import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'patient' | 'doctor' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  getToken: () => string | null;
  isPatient: () => boolean;
  isDoctor: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Login
      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: !!token
        });
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      // Get token
      getToken: () => get().token,

      // Check if patient
      isPatient: () => get().user?.userType === 'patient',

      // Check if doctor
      isDoctor: () => get().user?.userType === 'doctor',

      // Check if admin
      isAdmin: () => get().user?.userType === 'admin'
    }),
    {
      name: 'auth-storage'
    }
  )
);
