import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "RECRUITER" | "CANDIDATE" | "ADMIN";
}

interface AuthStore {
  user: User | null;
  isInitialized: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isInitialized: false,
      setAuth: (user) => set({ user, isInitialized: true }),
      clearAuth: () => set({ user: null, isInitialized: true }),
      setInitialized: (isInitialized) => set({ isInitialized }),
    }),
    {
      name: "tokenhire-auth",
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    },
  ),
);