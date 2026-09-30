import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ParametresFatigue } from "@/types/fiabilite";

/** Seuils de fatigue au volant (2026-09-29) — GET/PUT /api/parametres/fatigue. */
const CLE = ["parametres-fatigue"] as const;

export function useParametresFatigue() {
  return useQuery({
    queryKey: CLE,
    queryFn: async () => (await apiClient.get<ParametresFatigue>("/api/parametres/fatigue")).data,
  });
}

export function useMettreAJourParametresFatigue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requete: ParametresFatigue) => (await apiClient.put<ParametresFatigue>("/api/parametres/fatigue", requete)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(CLE, data);
      queryClient.invalidateQueries({ queryKey: ["fiabilite"] });
    },
  });
}
