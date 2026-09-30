import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** Réglages du contrôle de consommation carburant (2026-09-28) — GET/PUT /api/parametres/carburant. */
export interface ParametresCarburant {
  /** Dépassement toléré de la consommation de référence (L/100 km), en %. */
  seuilDepassementPourcent: number;
  /** Litres ignorés (complément après l'arrêt automatique de la pompe). */
  toleranceLitres: number;
}

const CLE = ["parametres-carburant"] as const;

export function useParametresCarburant() {
  return useQuery({
    queryKey: CLE,
    queryFn: async () => (await apiClient.get<ParametresCarburant>("/api/parametres/carburant")).data,
  });
}

export function useMettreAJourParametresCarburant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requete: ParametresCarburant) =>
      (await apiClient.put<ParametresCarburant>("/api/parametres/carburant", requete)).data,
    onSuccess: (data) => queryClient.setQueryData(CLE, data),
  });
}
