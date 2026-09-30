import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreerTravailMaintenanceRequest,
  ModifierTravailMaintenanceRequest,
  TravailMaintenance,
} from "@/types/travail-maintenance";

/** Référentiel « Travaux de maintenance » (V45) — même patron que les éléments de bord. */
export const travauxMaintenanceKeys = {
  referentiel: ["travaux-maintenance"] as const,
};

async function listerTravaux(): Promise<TravailMaintenance[]> {
  const { data } = await apiClient.get<TravailMaintenance[]>("/api/travaux-maintenance");
  return data;
}

async function creerTravail(requete: CreerTravailMaintenanceRequest): Promise<TravailMaintenance> {
  const { data } = await apiClient.post<TravailMaintenance>("/api/travaux-maintenance", requete);
  return data;
}

async function modifierTravail(id: number, requete: ModifierTravailMaintenanceRequest): Promise<TravailMaintenance> {
  const { data } = await apiClient.put<TravailMaintenance>(`/api/travaux-maintenance/${id}`, requete);
  return data;
}

async function changerActivationTravail(id: number, actif: boolean): Promise<TravailMaintenance> {
  const { data } = await apiClient.patch<TravailMaintenance>(`/api/travaux-maintenance/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

export function useTravauxMaintenance() {
  return useQuery({ queryKey: travauxMaintenanceKeys.referentiel, queryFn: listerTravaux, staleTime: 5 * 60_000 });
}

export function useCreerTravailMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerTravail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: travauxMaintenanceKeys.referentiel }),
  });
}

export function useModifierTravailMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierTravailMaintenanceRequest }) => modifierTravail(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: travauxMaintenanceKeys.referentiel }),
  });
}

export function useChangerActivationTravailMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationTravail(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: travauxMaintenanceKeys.referentiel }),
  });
}
