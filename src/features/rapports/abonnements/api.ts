import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AbonnementRapport, CreerAbonnementRequest, EnvoiRapport, FrequenceEnvoi, ParametresEnvoiRapports } from "@/types/diffusion";

/** Abonnements aux rapports par e-mail et planning des envois (2026-09-29). */
export const abonnementsKeys = {
  tout: ["abonnements-rapports"] as const,
  liste: (idUtilisateur: number | null) => ["abonnements-rapports", "liste", idUtilisateur ?? "moi"] as const,
  envois: (tous: boolean) => ["abonnements-rapports", "envois", tous] as const,
  parametres: ["parametres-envoi-rapports"] as const,
};

export function useAbonnements(idUtilisateur: number | null, actif = true) {
  return useQuery({
    queryKey: abonnementsKeys.liste(idUtilisateur),
    queryFn: async () =>
      (await apiClient.get<AbonnementRapport[]>("/api/abonnements-rapports", { params: { idUtilisateur: idUtilisateur ?? undefined } })).data,
    enabled: actif,
  });
}

export function useCreerAbonnement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (r: CreerAbonnementRequest) => (await apiClient.post<AbonnementRapport>("/api/abonnements-rapports", r)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: abonnementsKeys.tout }),
  });
}

export function useActiverAbonnement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valeur }: { id: number; valeur: boolean }) =>
      (await apiClient.patch<AbonnementRapport>(`/api/abonnements-rapports/${id}/actif`, null, { params: { valeur } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: abonnementsKeys.tout }),
  });
}

export function useSupprimerAbonnement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/abonnements-rapports/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: abonnementsKeys.tout }),
  });
}

export function useEnvoyerMaintenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ frequence, idUtilisateur }: { frequence: FrequenceEnvoi; idUtilisateur: number | null }) =>
      (
        await apiClient.post<EnvoiRapport>("/api/abonnements-rapports/envoyer-maintenant", null, {
          params: { frequence, idUtilisateur: idUtilisateur ?? undefined },
        })
      ).data,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: abonnementsKeys.tout });
      queryClient.invalidateQueries({ queryKey: ["rapports"] });
    },
  });
}

export function useHistoriqueEnvois(tous: boolean, actif = true) {
  return useQuery({
    queryKey: abonnementsKeys.envois(tous),
    queryFn: async () => (await apiClient.get<EnvoiRapport[]>("/api/abonnements-rapports/envois", { params: { tous } })).data,
    enabled: actif,
  });
}

export function useParametresEnvoiRapports(actif = true) {
  return useQuery({
    queryKey: abonnementsKeys.parametres,
    queryFn: async () => (await apiClient.get<ParametresEnvoiRapports>("/api/parametres/envoi-rapports")).data,
    enabled: actif,
  });
}

export function useMettreAJourParametresEnvoi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (r: Pick<ParametresEnvoiRapports, "actif" | "jourSemaine" | "jourMois" | "heure">) =>
      (await apiClient.put<ParametresEnvoiRapports>("/api/parametres/envoi-rapports", r)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(abonnementsKeys.parametres, data);
      queryClient.invalidateQueries({ queryKey: abonnementsKeys.tout });
    },
  });
}

export function useEnvoyerTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.post<EnvoiRapport>("/api/parametres/envoi-rapports/test")).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: abonnementsKeys.tout }),
  });
}
