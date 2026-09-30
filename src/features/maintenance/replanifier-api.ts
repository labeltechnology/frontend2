import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { maintenanceKeys } from "@/features/maintenance/api";
import type { Maintenance } from "@/types/maintenance";

/** PATCH /api/maintenances/{id}/date-prevue (2026-09-28) — datePrevue null = sans date. */
export interface ReplanifierMaintenanceRequest {
  datePrevue: string | null;
  motif?: string;
}

async function replanifier(id: number, requete: ReplanifierMaintenanceRequest): Promise<Maintenance> {
  const { data } = await apiClient.patch<Maintenance>(`/api/maintenances/${id}/date-prevue`, requete);
  return data;
}

export function useReplanifierMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ReplanifierMaintenanceRequest }) => replanifier(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.liste }),
  });
}
