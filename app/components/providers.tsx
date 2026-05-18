"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import AuthExpiryChecker from "./auth-expiry-checker";
import { isAuthErrorResponse, logoutAndRedirect } from "@/utils/authHelper";

declare global {
  interface Window {
    __authFetchInterceptorInstalled?: boolean;
  }
}

// QueryClient dibuat sekali di module level — tidak perlu useState.
// useState menyebabkan re-create saat hot reload di dev.
// useRef lebih tepat: nilai stabil, tidak trigger re-render.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,       // 5 menit — data dianggap fresh
        gcTime: 10 * 60 * 1000,          // 10 menit cache di memori
        retry: 1,
        refetchOnWindowFocus: false,      // jangan refetch saat user kembali ke tab
        refetchOnReconnect: true,         // refetch saat koneksi kembali
        refetchOnMount: false,            // jangan refetch jika data masih fresh
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // useRef: QueryClient stabil antar render, tidak trigger re-render
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = makeQueryClient();
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Guard: install interceptor hanya sekali per session
    if (window.__authFetchInterceptorInstalled) return;
    window.__authFetchInterceptorInstalled = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      // Clone response sebelum dicek agar body tidak habis terbaca
      if (await isAuthErrorResponse(response.clone())) {
        logoutAndRedirect();
      }
      return response;
    };

    // Cleanup tidak diperlukan — interceptor harus aktif selama session
  }, []);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AuthExpiryChecker />
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Kurangi durasi default agar toast tidak menumpuk
          duration: 3000,
          style: { maxWidth: "400px" },
        }}
      />
    </QueryClientProvider>
  );
}
