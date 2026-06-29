import { create } from "zustand"

export interface User {
  id: string
  name: string
  email: string
  role: "RECRUITER" | "CANDIDATE" | "ADMIN"
}

interface AuthStore {
  user: User | null
  setAuth: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setAuth: (user) => set({ user }),
  clearAuth: () => set({ user: null }),
}))