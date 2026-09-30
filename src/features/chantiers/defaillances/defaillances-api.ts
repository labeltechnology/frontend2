import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DefaillancesChantier, ImputationRequest, NatureDefaillance, Remplacant } from "@/types/chantier";

/** Défaillances et remplacements (V64) — ImputationChantierController, RemplacementController. */
export const defaillancesKeys = {
  chantier: (id: number) => ["chantiers", "defaillances", id] as const,
  remplacants: (id: number, idAffectation: number) => ["chantiers", "remplacants", id, idAffectation] as const,
};

export function useDefaillancesChantier(idChantier: number, actif = true) {
  return useQuery({
    queryKey: defaillancesKeys.chantier(idChantier),
    queryFn: async () => (await apiClient.get<DefaillancesChantier>(`/api/chantiers/${idChantier}/defaillances`)).data,
    enabled: actif,
  });
}

export function useImputer(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nature, id, requete }: { nature: NatureDefaillance; id: number; requete: ImputationRequest }) =>
      (await apiClient.put(nature === "INCIDENT" ? `/api/incidents/${id}/imputation` : `/api/maintenances/${id}/imputation`, requete)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: defaillancesKeys.chantier(idChantier) });
      void queryClient.invalidateQueries({ queryKey: ["chantiers", "couts", idChantier] });
    },
  });
}

export function useRemplacants(idChantier: number, idAffectation: number | null) {
  return useQuery({
    queryKey: defaillancesKeys.remplacants(idChantier, idAffectation ?? 0),
    queryFn: async () =>
      (await apiClient.get<Remplacant[]>(`/api/chantiers/${idChantier}/remplacants`, { params: { idAffectation } })).data,
    enabled: idAffectation !== null,
  });
}

export function useRemplacer(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idAffectation, idEngin }: { idAffectation: number; idEngin: number }) =>
      (await apiClient.post(`/api/chantiers/${idChantier}/remplacer`, { idAffectation, idEngin })).data,
    onSuccess: () => {
      for (const cle of [["chantiers"], ["fiche-chantier"], ["affectations-chantier"], ["engins"]]) {
        void queryClient.invalidateQueries({ queryKey: cle });
      }
    },
  });
}
