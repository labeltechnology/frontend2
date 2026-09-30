import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Previsions } from "@/types/prevision";

/** Onglet « Prévisions » de la page Coûts (2026-09-29). */
export function usePrevisions(idTypeEngin: number | null, actif = true) {
  return useQuery({
    queryKey: ["couts", "previsions", idTypeEngin ?? "tous"] as const,
    queryFn: async () =>
      (await apiClient.get<Previsions>("/api/previsions", { params: { idTypeEngin: idTypeEngin ?? undefined } })).data,
    enabled: actif,
  });
}
