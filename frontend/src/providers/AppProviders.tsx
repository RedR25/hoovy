import { type ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import { createQueryClient } from "@/shared/query/queryClient";
import { AuthProvider } from "@/features/auth/AuthProvider";

/**
 * Root provider stack — the frontend's DI seam.
 *
 * Order matters: outer providers can be consumed by inner ones.
 * Each provider exposes a hook (useAuth, useQueryClient, etc.) so feature
 * components depend on an interface, not a concrete singleton.
 */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(createQueryClient);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};
