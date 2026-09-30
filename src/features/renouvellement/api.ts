import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  BesoinsFuturs,
  EnregistrerCessionRequest,
  FinDeVie,
  FinDeVieVehicule,
  PlanRenouvellement,
} from "@/types/renouvellement";

/** Page « Renouvellement » (2026-09-29). */
export const renouvellementKeys = {
  tout: ["renouvellement"] as const,
  plan: ["renouvellement", "plan"] as const,
  besoins: ["renouvellement", "besoins"] as const,
  finDeVie: ["renouvellement", "fin-de-vie"] as const,
};

export function usePlanRenouvellement(actif = true) {
  return useQuery({
    queryKey: renouvellementKeys.plan,
    queryFn: async () => (await apiClient.get<PlanRenouvellement>("/api/renouvellement/plan")).data,
    enabled: actif,
    staleTime: 5 * 60_000,
  });
}

export function useBesoinsFuturs(actif = true) {
  return useQuery({
    queryKey: renouvellementKeys.besoins,
    queryFn: async () => (await apiClient.get<BesoinsFuturs>("/api/renouvellement/besoins")).data,
    enabled: actif,
    staleTime: 5 * 60_000,
  });
}

export function useFinDeVie(actif = true) {
  return useQuery({
    queryKey: renouvellementKeys.finDeVie,
    queryFn: async () => (await apiClient.get<FinDeVie>("/api/renouvellement/fin-de-vie")).data,
    enabled: actif,
  });
}

export function useEnregistrerCession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idEngin, requete }: { idEngin: number; requete: EnregistrerCessionRequest }) =>
      (await apiClient.put<FinDeVieVehicule>(`/api/engins/${idEngin}/cession`, requete)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renouvellementKeys.tout });
      // Le véhicule change de statut (vendu ou réformé).
      queryClient.invalidateQueries({ queryKey: ["engins"] });
    },
  });
}
