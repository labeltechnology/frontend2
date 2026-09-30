import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ScoresConduite } from "@/types/conduite";
import type {
  CoutVehicule,
  EnregistrerBudgetCarburantRequest,
  EnregistrerCoutVehiculeRequest,
  SuiviBudgetCarburant,
  TcoParc,
  VehiculesProblematiques,
} from "@/types/couts";

/** Page « Coûts et rentabilité » et onglet « Coûts » de la fiche véhicule (2026-09-29). */
export const coutsKeys = {
  tout: ["couts"] as const,
  tco: (debut: string, fin: string, idTypeEngin: number | null) => ["couts", "tco", debut, fin, idTypeEngin ?? "tous"] as const,
  problemes: ["couts", "problemes"] as const,
  budget: (annee: number) => ["couts", "budget", annee] as const,
  vehicule: (idEngin: number) => ["couts", "vehicule", idEngin] as const,
  conduite: (mois: string) => ["conduite", mois] as const,
};

export function useTco(debut: string, fin: string, idTypeEngin: number | null) {
  return useQuery({
    queryKey: coutsKeys.tco(debut, fin, idTypeEngin),
    queryFn: async () =>
      (await apiClient.get<TcoParc>("/api/couts/tco", { params: { debut, fin, idTypeEngin: idTypeEngin ?? undefined } })).data,
    enabled: Boolean(debut && fin && debut <= fin),
    staleTime: 60_000,
  });
}

export function useVehiculesProblematiques(actif = true) {
  return useQuery({
    queryKey: coutsKeys.problemes,
    queryFn: async () => (await apiClient.get<VehiculesProblematiques>("/api/couts/vehicules-problematiques")).data,
    enabled: actif,
    staleTime: 60_000,
  });
}

export function useBudgetCarburant(annee: number, actif = true) {
  return useQuery({
    queryKey: coutsKeys.budget(annee),
    queryFn: async () => (await apiClient.get<SuiviBudgetCarburant>("/api/couts/budget-carburant", { params: { annee } })).data,
    enabled: actif,
    staleTime: 60_000,
  });
}

export function useEnregistrerBudgetCarburant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requete: EnregistrerBudgetCarburantRequest) => {
      await apiClient.put("/api/couts/budget-carburant", requete);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coutsKeys.tout }),
  });
}

export function useSupprimerBudgetCarburant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/couts/budget-carburant/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coutsKeys.tout }),
  });
}

export function useCoutVehicule(idEngin: number) {
  return useQuery({
    queryKey: coutsKeys.vehicule(idEngin),
    queryFn: async () => (await apiClient.get<CoutVehicule>(`/api/engins/${idEngin}/couts`)).data,
  });
}

export function useEnregistrerCoutVehicule(idEngin: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requete: EnregistrerCoutVehiculeRequest) =>
      (await apiClient.put<CoutVehicule>(`/api/engins/${idEngin}/couts`, requete)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(coutsKeys.vehicule(idEngin), data);
      queryClient.invalidateQueries({ queryKey: coutsKeys.tout });
    },
  });
}

export function useScoresConduite(mois: string, actif = true) {
  return useQuery({
    queryKey: coutsKeys.conduite(mois),
    queryFn: async () => (await apiClient.get<ScoresConduite>("/api/conduite/scores", { params: { mois } })).data,
    enabled: actif && /^\d{4}-\d{2}$/.test(mois),
    staleTime: 60_000,
  });
}
