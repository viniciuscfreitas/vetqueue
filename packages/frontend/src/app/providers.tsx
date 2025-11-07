"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { initClientLogger } from "@/lib/clientLogger";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ignoreRejection = (e: PromiseRejectionEvent) => {
      if (e.reason?.message?.includes("insertBefore")) e.preventDefault();
    };

    window.addEventListener("unhandledrejection", ignoreRejection);
    const cleanupLogger = initClientLogger();

    return () => {
      window.removeEventListener("unhandledrejection", ignoreRejection);
      cleanupLogger?.();
    };
  }, []);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              const status = error?.response?.status;
              if (status && status >= 500) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

