import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { maintenanceKeys } from "@/features/maintenance/api";
import type { DefinirCoutsGarageRequest, Maintenance } from "@/types/maintenance";

/** Pièces et main-d'œuvre d'un garage externe (V46, 2026-09-25) : la liste envoyée remplace la précédente. */
async function definirCoutsGarage(idMaintenance: number, requete: DefinirCoutsGarageRequest): Promise<Maintenance> {
  const { data } = await apiClient.put<Maintenance>(`/api/maintenances/${idMaintenance}/couts-garage`, requete);
  return data;
}

export function useDefinirCoutsGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idMaintenance, requete }: { idMaintenance: number; requete: DefinirCoutsGarageRequest }) =>
      definirCoutsGarage(idMaintenance, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.liste }),
  });
}
