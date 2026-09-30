import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Carburant, ConsommationMoyenne, CreerCarburantRequest } from "@/types/carburant";

export const carburantKeys = {
  liste: ["carburant"] as const,
  consommation: (idEngin: number) => ["carburant", "consommation", idEngin] as const,
};

async function listerCarburant(): Promise<Carburant[]> {
  const { data } = await apiClient.get<Carburant[]>("/api/carburant");
  return data;
}

/**
 * confirmer (2026-09-29, qualité des saisies) : une saisie douteuse (distance
 * impossible, saisie antidatée…) répond 422 avec les points à vérifier dans
 * `details` ; renvoyée avec confirmer = true, elle est enregistrée et une
 * alerte « Saisie à vérifier » est créée.
 */
async function enregistrerCarburant({ confirmer, ...requete }: CreerCarburantRequest & { confirmer?: boolean }): Promise<Carburant> {
  const { data } = await apiClient.post<Carburant>("/api/carburant", requete, { params: confirmer ? { confirmer: true } : undefined });
  return data;
}

async function consommationMoyenne(idEngin: number): Promise<ConsommationMoyenne> {
  const { data } = await apiClient.get<ConsommationMoyenne>(`/api/carburant/engins/${idEngin}/consommation-moyenne`);
  return data;
}

export function useCarburant() {
  return useQuery({ queryKey: carburantKeys.liste, queryFn: listerCarburant });
}

export function useEnregistrerCarburant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enregistrerCarburant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: carburantKeys.liste }),
  });
}

export function useConsommationMoyenne(idEngin: number | null) {
  return useQuery({
    queryKey: carburantKeys.consommation(idEngin ?? 0),
    queryFn: () => consommationMoyenne(idEngin as number),
    enabled: idEngin !== null,
  });
}
