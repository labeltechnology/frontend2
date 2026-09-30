import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** Mots de passe (2026-09-29) : le sien, ou celui d'un autre compte (administration). */
export function useChangerMonMotDePasse() {
  return useMutation({
    mutationFn: async (r: { ancienMotDePasse: string; nouveauMotDePasse: string }) => {
      await apiClient.put("/api/mon-compte/mot-de-passe", r);
    },
  });
}

export function useReinitialiserMotDePasse() {
  return useMutation({
    mutationFn: async ({ idUtilisateur, nouveauMotDePasse }: { idUtilisateur: number; nouveauMotDePasse: string }) => {
      await apiClient.put(`/api/utilisateurs/${idUtilisateur}/mot-de-passe`, { nouveauMotDePasse });
    },
  });
}
