import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
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
