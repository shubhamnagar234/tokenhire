"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore, User } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { ThemeProvider } from "next-themes";
import { useQuery } from "@tanstack/react-query";

function AuthInit() {
  const setAuth = useAuthStore((state) => state.setAuth);

  useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      try {
        const data = await apiRequest<{ user: User }>("/api/auth/me");
        setAuth(data.user);
        return data.user;
      } catch (err) {
        // Expected for unauthenticated users (no cookie / expired token).
        // Log unexpected errors in dev to surface misconfigurations.
        if (process.env.NODE_ENV === "development") {
          console.warn("[AuthInit] /api/auth/me failed:", err);
        }
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthInit />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
