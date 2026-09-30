import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MaintenanceProforma } from "@/types/maintenance";

/**
 * Proforma du garage externe pour une maintenance — demande explicite de
 * l'utilisateur (« il faut uplouader aussi le facture proformat du garage
 * externe avant de valider la maintenance externe »). Un seul proforma par
 * maintenance : un nouvel envoi remplace le précédent côté serveur (voir
 * MaintenanceProformaService), donc une seule requête GET suffit (pas de
 * liste, à la différence de {@code photos-api.ts}).
 */
export const maintenanceProformaKeys = {
  detail: (idMaintenance: number) => ["maintenances", idMaintenance, "proforma"] as const,
};

async function obtenirProforma(idMaintenance: number): Promise<MaintenanceProforma | null> {
  // 204 (aucun proforma téléversé) fait partie de la plage 2xx par défaut d'axios : pas besoin
  // de validateStatus personnalisé, la requête ne rejette pas et reponse.data est simplement vide.
  const reponse = await apiClient.get<MaintenanceProforma>(`/api/maintenances/${idMaintenance}/proforma`);
  return reponse.status === 204 ? null : reponse.data;
}

async function televerserProforma(idMaintenance: number, fichier: File): Promise<MaintenanceProforma> {
  const formData = new FormData();
  formData.append("fichier", fichier);
  // Même principe que photos-api.ts : on neutralise le Content-Type JSON par défaut de l'apiClient
  // pour laisser le navigateur poser lui-même l'en-tête multipart/form-data avec sa frontière.
  const { data } = await apiClient.post<MaintenanceProforma>(
    `/api/maintenances/${idMaintenance}/proforma`,
    formData,
    { headers: { "Content-Type": undefined } },
  );
  return data;
}

export function useMaintenanceProforma(idMaintenance: number | undefined) {
  return useQuery({
    queryKey: maintenanceProformaKeys.detail(idMaintenance ?? 0),
    queryFn: () => obtenirProforma(idMaintenance as number),
    enabled: idMaintenance !== undefined,
  });
}

export function useTeleverserProforma(idMaintenance: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fichier: File) => televerserProforma(idMaintenance as number, fichier),
    onSuccess: () => {
      if (idMaintenance !== undefined) {
        queryClient.invalidateQueries({ queryKey: maintenanceProformaKeys.detail(idMaintenance) });
      }
    },
  });
}
