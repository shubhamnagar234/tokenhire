"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useAuthStore, User } from "@/lib/store/auth"
import { apiRequest } from "@/lib/api"

function AuthInit() {
  const setAuth = useAuthStore((state) => state.setAuth)

  useEffect(() => {
    apiRequest<{ user: User }>("/api/auth/me")
      .then((data) => {
        setAuth(data.user)
      })
      .catch(() => {
        // Not logged in or token invalid
      })
  }, [setAuth])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit />
      {children}
    </QueryClientProvider>
  )
}