"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import AuthExpiryChecker from "./auth-expiry-checker";
import { isAuthErrorResponse, logoutAndRedirect } from "@/utils/authHelper";

declare global {
  interface Window {
    __authFetchInterceptorInstalled?: boolean;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 menit - data dianggap fresh lebih lama
            gcTime: 10 * 60 * 1000, // 10 menit cache di memori
            retry: 1,
            refetchOnWindowFocus: false, // Jangan refetch saat user kembali ke tab
            refetchOnReconnect: true, // Hanya refetch saat koneksi kembali
          },
        },
      }),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__authFetchInterceptorInstalled) return;

    window.__authFetchInterceptorInstalled = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (await isAuthErrorResponse(response)) {
        logoutAndRedirect();
      }
      return response;
    };

    return () => {
      if (window.fetch === originalFetch) {
        window.fetch = originalFetch;
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthExpiryChecker />
      {children}
      <Toaster position="top-right" reverseOrder={false} />
    </QueryClientProvider>
  );
}
