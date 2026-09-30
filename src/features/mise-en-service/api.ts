import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MiseEnService } from "@/features/mise-en-service/types";

export const miseEnServiceKeys = { tout: ["mise-en-service"] as const };

/** GET /api/mise-en-service : avancement recalculé à chaque ouverture (ADMINISTRER). */
export function useMiseEnService() {
  return useQuery({
    queryKey: miseEnServiceKeys.tout,
    queryFn: async () => (await apiClient.get<MiseEnService>("/api/mise-en-service")).data,
  });
}
