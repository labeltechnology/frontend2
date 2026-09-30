import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerUtilisateurRequest, Utilisateur } from "@/types/utilisateur";

export const utilisateursKeys = {
  liste: ["utilisateurs"] as const,
};

async function listerUtilisateurs(): Promise<Utilisateur[]> {
  const { data } = await apiClient.get<Utilisateur[]>("/api/utilisateurs");
  return data;
}

async function creerUtilisateur(requete: CreerUtilisateurRequest): Promise<Utilisateur> {
  const { data } = await apiClient.post<Utilisateur>("/api/utilisateurs", requete);
  return data;
}

/** Règle 1.10 : jamais de suppression physique — ce DELETE désactive le compte côté backend. */
async function desactiverUtilisateur(id: number): Promise<void> {
  await apiClient.delete(`/api/utilisateurs/${id}`);
}

/** actif = false : pas de requête (écrans ouverts à des rôles sans ADMINISTRER). */
export function useUtilisateurs(actif = true) {
  return useQuery({ queryKey: utilisateursKeys.liste, queryFn: listerUtilisateurs, enabled: actif });
}

export function useCreerUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerUtilisateur,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: utilisateursKeys.liste }),
  });
}

export function useDesactiverUtilisateur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: desactiverUtilisateur,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: utilisateursKeys.liste }),
  });
}
