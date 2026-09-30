import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerFournisseurRequest, Fournisseur, ModifierFournisseurRequest } from "@/types/fournisseur";

export const fournisseursKeys = {
  liste: ["fournisseurs"] as const,
};

async function listerFournisseurs(): Promise<Fournisseur[]> {
  const { data } = await apiClient.get<Fournisseur[]>("/api/fournisseurs");
  return data;
}

async function creerFournisseur(requete: CreerFournisseurRequest): Promise<Fournisseur> {
  const { data } = await apiClient.post<Fournisseur>("/api/fournisseurs", requete);
  return data;
}

async function modifierFournisseur(id: number, requete: ModifierFournisseurRequest): Promise<Fournisseur> {
  const { data } = await apiClient.put<Fournisseur>(`/api/fournisseurs/${id}`, requete);
  return data;
}

async function changerActivationFournisseur(id: number, actif: boolean): Promise<Fournisseur> {
  const { data } = await apiClient.patch<Fournisseur>(`/api/fournisseurs/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

export function useFournisseurs() {
  return useQuery({ queryKey: fournisseursKeys.liste, queryFn: listerFournisseurs });
}

export function useCreerFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerFournisseur,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fournisseursKeys.liste }),
  });
}

export function useModifierFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierFournisseurRequest }) =>
      modifierFournisseur(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fournisseursKeys.liste }),
  });
}

export function useChangerActivationFournisseur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationFournisseur(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fournisseursKeys.liste }),
  });
}
