import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Conducteur, CreerConducteurRequest, ModifierConducteurRequest } from "@/types/conducteur";

export const conducteursKeys = {
  liste: ["conducteurs"] as const,
};

async function listerConducteurs(): Promise<Conducteur[]> {
  const { data } = await apiClient.get<Conducteur[]>("/api/conducteurs");
  return data;
}

async function creerConducteur(requete: CreerConducteurRequest): Promise<Conducteur> {
  const { data } = await apiClient.post<Conducteur>("/api/conducteurs", requete);
  return data;
}

async function modifierConducteur(id: number, requete: ModifierConducteurRequest): Promise<Conducteur> {
  const { data } = await apiClient.put<Conducteur>(`/api/conducteurs/${id}`, requete);
  return data;
}

async function suspendreConducteur(id: number): Promise<Conducteur> {
  const { data } = await apiClient.patch<Conducteur>(`/api/conducteurs/${id}/suspendre`);
  return data;
}

async function reactiverConducteur(id: number): Promise<Conducteur> {
  const { data } = await apiClient.patch<Conducteur>(`/api/conducteurs/${id}/reactiver`);
  return data;
}

export function useConducteurs() {
  return useQuery({ queryKey: conducteursKeys.liste, queryFn: listerConducteurs });
}

export function useCreerConducteur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerConducteur,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conducteursKeys.liste }),
  });
}

export function useModifierConducteur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierConducteurRequest }) =>
      modifierConducteur(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conducteursKeys.liste }),
  });
}

export function useSuspendreConducteur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suspendreConducteur,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conducteursKeys.liste }),
  });
}

export function useReactiverConducteur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactiverConducteur,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conducteursKeys.liste }),
  });
}
