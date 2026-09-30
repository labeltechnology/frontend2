import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ChantierResume, CoutsChantier } from "@/types/chantier";

/**
 * Suivi des chantiers (2026-09-29) — SuiviChantiersController côté serveur.
 * Les clés commencent par « chantiers » : invalider la liste des chantiers
 * rafraîchit aussi la synthèse.
 */
export const suiviChantiersKeys = {
  synthese: ["chantiers", "synthese"] as const,
  couts: (idChantier: number) => ["chantiers", "couts", idChantier] as const,
};

export function useSyntheseChantiers() {
  return useQuery({
    queryKey: suiviChantiersKeys.synthese,
    queryFn: async () => (await apiClient.get<ChantierResume[]>("/api/chantiers/synthese")).data,
  });
}

export function useCoutsChantier(idChantier: number | undefined, actif = true) {
  return useQuery({
    queryKey: suiviChantiersKeys.couts(idChantier ?? 0),
    queryFn: async () => (await apiClient.get<CoutsChantier>(`/api/chantiers/${idChantier}/couts`)).data,
    enabled: actif && idChantier !== undefined,
  });
}

/**
 * Après le démarrage, la fin ou l'annulation d'un chantier : ses véhicules et
 * conducteurs sont libérés côté serveur, les listes qui les montrent sont donc
 * rechargées (chantiers, rattachements, fiches, candidats, alertes).
 */
export function useRafraichirApresStatut() {
  const queryClient = useQueryClient();
  return () => {
    for (const cle of [["chantiers"], ["affectations-chantier"], ["affectations-conducteur-chantier"], ["fiche-chantier"], ["alertes"]]) {
      void queryClient.invalidateQueries({ queryKey: cle });
    }
  };
}
