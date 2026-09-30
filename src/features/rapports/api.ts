import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { GenererRapportRequest, PresentationRapport, Rapport } from "@/types/rapport";

export const rapportsKeys = {
  liste: ["rapports"] as const,
  presentation: (idRapport: number) => ["rapports", idRapport, "presentation"] as const,
};

async function listerRapports(): Promise<Rapport[]> {
  const { data } = await apiClient.get<Rapport[]>("/api/rapports");
  return data;
}

async function genererRapport(requete: GenererRapportRequest): Promise<Rapport> {
  const { data } = await apiClient.post<Rapport>("/api/rapports", requete);
  return data;
}

async function presentationRapport(idRapport: number): Promise<PresentationRapport> {
  const { data } = await apiClient.get<PresentationRapport>(`/api/rapports/${idRapport}/presentation`);
  return data;
}

export function useRapports() {
  return useQuery({ queryKey: rapportsKeys.liste, queryFn: listerRapports });
}

export function useGenererRapport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: genererRapport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rapportsKeys.liste }),
  });
}

/**
 * Rapport mis en forme (2026-09-28) : chiffres clés, répartitions et listes,
 * exactement le contenu du PDF et de l'Excel. Un rapport ne change jamais
 * après sa génération : pas de rechargement automatique.
 */
export function usePresentationRapport(idRapport: number | null) {
  return useQuery({
    queryKey: rapportsKeys.presentation(idRapport ?? 0),
    queryFn: () => presentationRapport(idRapport as number),
    enabled: idRapport !== null,
    staleTime: Infinity,
  });
}

// --- Export PDF / Excel (NB de l'utilisateur : un aperçu doit précéder tout export) ---

async function telechargerRapportPdf(idRapport: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/api/rapports/${idRapport}/export/pdf`, { responseType: "blob" });
  return data;
}

async function telechargerRapportExcel(idRapport: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/api/rapports/${idRapport}/export/excel`, { responseType: "blob" });
  return data;
}

export function useRapportPdf() {
  return useMutation({ mutationFn: telechargerRapportPdf });
}

export function useRapportExcel() {
  return useMutation({ mutationFn: telechargerRapportExcel });
}
