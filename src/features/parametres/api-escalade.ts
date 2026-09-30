import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** Escalade des alertes non traitées (2026-09-28) — GET/PUT /api/parametres/escalade-alertes. Délais en jours, 0 = pas de montée. */
export interface ParametresEscaladeAlertes {
  actif: boolean;
  joursFaibleVersMoyenne: number;
  joursMoyenneVersElevee: number;
  joursEleveeVersCritique: number;
}

const CLE = ["parametres-escalade-alertes"] as const;

export function useParametresEscaladeAlertes() {
  return useQuery({
    queryKey: CLE,
    queryFn: async () => (await apiClient.get<ParametresEscaladeAlertes>("/api/parametres/escalade-alertes")).data,
  });
}

export function useMettreAJourParametresEscaladeAlertes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requete: ParametresEscaladeAlertes) =>
      (await apiClient.put<ParametresEscaladeAlertes>("/api/parametres/escalade-alertes", requete)).data,
    onSuccess: (data) => queryClient.setQueryData(CLE, data),
  });
}
