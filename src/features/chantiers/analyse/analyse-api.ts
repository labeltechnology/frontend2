import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AnalyseChantiers } from "@/types/chantier";

/** Analyse des chantiers (V64) — AnalyseChantiersController. */
export function useAnalyseChantiers(actif = true) {
  return useQuery({
    queryKey: ["chantiers", "analyse"],
    queryFn: async () => (await apiClient.get<AnalyseChantiers>("/api/chantiers/analyse")).data,
    enabled: actif,
    staleTime: 60_000,
  });
}
