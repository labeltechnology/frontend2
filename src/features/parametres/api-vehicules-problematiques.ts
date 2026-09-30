import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SeuilsProblemes } from "@/types/couts";

/** Seuils « véhicule à surveiller / à remplacer » (2026-09-29) — GET/PUT /api/parametres/vehicules-problematiques. */
const CLE = ["parametres-vehicules-problematiques"] as const;

export function useParametresVehiculesProblematiques() {
  return useQuery({
    queryKey: CLE,
    queryFn: async () => (await apiClient.get<SeuilsProblemes>("/api/parametres/vehicules-problematiques")).data,
  });
}

export function useMettreAJourParametresVehiculesProblematiques() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requete: SeuilsProblemes) =>
      (await apiClient.put<SeuilsProblemes>("/api/parametres/vehicules-problematiques", requete)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(CLE, data);
      queryClient.invalidateQueries({ queryKey: ["couts"] });
    },
  });
}
