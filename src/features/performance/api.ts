import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PerformanceParc } from "@/types/performance";

/** Page « Performance et utilisation » (2026-09-28). */
export const performanceKeys = {
  tout: ["performance"] as const,
  periode: (debut: string, fin: string, idTypeEngin: number | null) =>
    ["performance", debut, fin, idTypeEngin ?? "tous"] as const,
};

async function lirePerformance(debut: string, fin: string, idTypeEngin: number | null): Promise<PerformanceParc> {
  const { data } = await apiClient.get<PerformanceParc>("/api/performance", {
    params: { debut, fin, idTypeEngin: idTypeEngin ?? undefined },
  });
  return data;
}

async function modifierObjectif(code: string, valeur: number | null): Promise<void> {
  await apiClient.put(`/api/performance/objectifs/${code}`, { valeur });
}

/** Calcul serveur sur la période ; désactivé tant que les dates sont incomplètes ou incohérentes. */
export function usePerformance(debut: string, fin: string, idTypeEngin: number | null) {
  return useQuery({
    queryKey: performanceKeys.periode(debut, fin, idTypeEngin),
    queryFn: () => lirePerformance(debut, fin, idTypeEngin),
    enabled: Boolean(debut && fin && debut <= fin),
    staleTime: 60_000,
  });
}

/** Objectif d'un KPI (capacité GERER_PARC) ; null = retirer l'objectif. */
export function useModifierObjectifKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, valeur }: { code: string; valeur: number | null }) => modifierObjectif(code, valeur),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: performanceKeys.tout }),
  });
}
