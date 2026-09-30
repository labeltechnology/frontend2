import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerDemandeRequest, DemandeMateriel, IndicateursDemandes } from "@/types/chantier";

/** Demandes de matériel (V64) — DemandeMaterielController. Clés sous « chantiers » : la liste se rafraîchit avec eux. */
export const demandesKeys = {
  liste: (idChantier?: number) => ["chantiers", "demandes", idChantier ?? "toutes"] as const,
  indicateurs: ["chantiers", "demandes", "indicateurs"] as const,
};

export function useDemandes(idChantier?: number, actif = true) {
  return useQuery({
    queryKey: demandesKeys.liste(idChantier),
    queryFn: async () =>
      (await apiClient.get<DemandeMateriel[]>("/api/demandes-materiel", { params: idChantier ? { idChantier } : undefined })).data,
    enabled: actif,
  });
}

export function useIndicateursDemandes(actif = true) {
  return useQuery({
    queryKey: demandesKeys.indicateurs,
    queryFn: async () => (await apiClient.get<IndicateursDemandes>("/api/demandes-materiel/indicateurs")).data,
    enabled: actif,
  });
}

function useRafraichir() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["chantiers", "demandes"] });
    void queryClient.invalidateQueries({ queryKey: ["chantiers", "synthese"] });
    void queryClient.invalidateQueries({ queryKey: ["alertes"] });
  };
}

export function useCreerDemande() {
  const rafraichir = useRafraichir();
  return useMutation({
    mutationFn: async (requete: CreerDemandeRequest) => (await apiClient.post<DemandeMateriel>("/api/demandes-materiel", requete)).data,
    onSuccess: rafraichir,
  });
}

export function useRepondreDemande() {
  const rafraichir = useRafraichir();
  return useMutation({
    mutationFn: async ({ id, accepter, reponse }: { id: number; accepter: boolean; reponse?: string }) =>
      (await apiClient.post<DemandeMateriel>(`/api/demandes-materiel/${id}/repondre`, { accepter, reponse })).data,
    onSuccess: rafraichir,
  });
}

export function useAnnulerDemande() {
  const rafraichir = useRafraichir();
  return useMutation({
    mutationFn: async (id: number) => (await apiClient.post<DemandeMateriel>(`/api/demandes-materiel/${id}/annuler`)).data,
    onSuccess: rafraichir,
  });
}
