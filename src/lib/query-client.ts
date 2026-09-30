import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Ne jamais réessayer une erreur d'autorisation (401/403) ou de
        // validation (400) : ce sont des échecs définitifs pour cette
        // requête, pas des pannes transitoires.
        if (error instanceof ApiError && [400, 401, 403, 404, 409].includes(error.statut)) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
