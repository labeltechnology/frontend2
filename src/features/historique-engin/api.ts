import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ControleBordHistorique, InterventionEntretienHistorique } from "@/types/historique-engin";

/**
 * Historiques propres à la page « Historique du véhicule » (V44). Les autres
 * onglets réutilisent les hooks existants (documents, alertes, maintenances,
 * chantiers, affectations). `staleTime: 0` : la page relit toujours
 * l'historique à l'ouverture, pour montrer un contrôle ou une intervention
 * qui vient d'être saisi sur la fiche sans toucher aux mutations existantes.
 */
export const historiqueEnginKeys = {
  controlesBord: (idEngin: number) => ["engins", idEngin, "historique", "controles-bord"] as const,
  interventions: (idEngin: number) => ["engins", idEngin, "historique", "interventions"] as const,
};

async function listerControlesBord(idEngin: number): Promise<ControleBordHistorique[]> {
  const { data } = await apiClient.get<ControleBordHistorique[]>(`/api/engins/${idEngin}/equipements-bord/historique`);
  return data;
}

async function listerInterventions(idEngin: number): Promise<InterventionEntretienHistorique[]> {
  const { data } = await apiClient.get<InterventionEntretienHistorique[]>(
    `/api/engins/${idEngin}/echeances-entretien/historique`,
  );
  return data;
}

export function useHistoriqueControlesBord(idEngin: number) {
  return useQuery({
    queryKey: historiqueEnginKeys.controlesBord(idEngin),
    queryFn: () => listerControlesBord(idEngin),
    staleTime: 0,
  });
}

export function useHistoriqueInterventions(idEngin: number) {
  return useQuery({
    queryKey: historiqueEnginKeys.interventions(idEngin),
    queryFn: () => listerInterventions(idEngin),
    staleTime: 0,
  });
}
