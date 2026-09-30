import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AlertePilotage, CoutsMois, FlottePilotage, KpiPilotage, ReglageKpiRequest } from "@/types/pilotage";

/**
 * API du tableau de bord de direction (2026-09-30, DG et responsable du parc).
 * Clés sous « pilotage » : relues avec les vues de synthèse quand le temps
 * réel signale un changement (lib/temps-reel/canaux.ts).
 */
export const pilotageKeys = {
  tout: ["pilotage"] as const,
  kpi: ["pilotage", "kpi"] as const,
  alertes: ["pilotage", "alertes"] as const,
  flotte: ["pilotage", "flotte"] as const,
  couts: (mois: string) => ["pilotage", "couts", mois] as const,
};

export function useKpiPilotage(actif: boolean) {
  return useQuery({
    queryKey: pilotageKeys.kpi,
    queryFn: async () => (await apiClient.get<KpiPilotage[]>("/api/pilotage/kpi")).data,
    enabled: actif,
    staleTime: 30_000,
  });
}

export function useAlertesPilotage(actif: boolean) {
  return useQuery({
    queryKey: pilotageKeys.alertes,
    queryFn: async () => (await apiClient.get<AlertePilotage[]>("/api/pilotage/alertes")).data,
    enabled: actif,
    staleTime: 15_000,
  });
}

export function useFlottePilotage(actif: boolean) {
  return useQuery({
    queryKey: pilotageKeys.flotte,
    queryFn: async () => (await apiClient.get<FlottePilotage>("/api/pilotage/flotte")).data,
    enabled: actif,
    staleTime: 15_000,
  });
}

export function useCoutsMois(mois: string, actif: boolean) {
  return useQuery({
    queryKey: pilotageKeys.couts(mois),
    queryFn: async () => (await apiClient.get<CoutsMois>("/api/pilotage/couts", { params: { mois } })).data,
    enabled: actif,
    staleTime: 30_000,
  });
}

export function useReglerKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, reglage }: { code: string; reglage: ReglageKpiRequest }) =>
      (await apiClient.put(`/api/pilotage/kpi/${code}`, reglage)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pilotageKeys.kpi });
      void queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
  });
}
