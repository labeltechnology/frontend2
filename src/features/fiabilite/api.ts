import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Conformite,
  EnregistrerReglageTypeRequest,
  EnregistrerSinistreRequest,
  FiabiliteParc,
  ReglageType,
  Sinistralite,
  Sinistre,
} from "@/types/fiabilite";

/** Page « Fiabilité et conformité » et volet sinistre des incidents (2026-09-29). */
export const fiabiliteKeys = {
  tout: ["fiabilite"] as const,
  parc: (debut: string, fin: string, idTypeEngin: number | null) => ["fiabilite", "parc", debut, fin, idTypeEngin ?? "tous"] as const,
  reglages: ["fiabilite", "reglages-types"] as const,
  conformite: ["fiabilite", "conformite"] as const,
  sinistralite: (debut: string, fin: string) => ["fiabilite", "sinistres", debut, fin] as const,
  sinistre: (idIncident: number) => ["fiabilite", "sinistre", idIncident] as const,
};

export function useFiabilite(debut: string, fin: string, idTypeEngin: number | null) {
  return useQuery({
    queryKey: fiabiliteKeys.parc(debut, fin, idTypeEngin),
    queryFn: async () =>
      (await apiClient.get<FiabiliteParc>("/api/fiabilite", { params: { debut, fin, idTypeEngin: idTypeEngin ?? undefined } })).data,
    enabled: Boolean(debut && fin && debut <= fin),
    staleTime: 60_000,
  });
}

export function useReglagesTypes(actif = true) {
  return useQuery({
    queryKey: fiabiliteKeys.reglages,
    queryFn: async () => (await apiClient.get<ReglageType[]>("/api/fiabilite/reglages-types")).data,
    enabled: actif,
  });
}

export function useEnregistrerReglageType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idTypeEngin, requete }: { idTypeEngin: number; requete: EnregistrerReglageTypeRequest }) =>
      (await apiClient.put<ReglageType>(`/api/fiabilite/reglages-types/${idTypeEngin}`, requete)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fiabiliteKeys.tout }),
  });
}

export function useConformite(actif = true) {
  return useQuery({
    queryKey: fiabiliteKeys.conformite,
    queryFn: async () => (await apiClient.get<Conformite>("/api/conformite")).data,
    enabled: actif,
    staleTime: 60_000,
  });
}

export function useSinistralite(debut: string, fin: string, actif = true) {
  return useQuery({
    queryKey: fiabiliteKeys.sinistralite(debut, fin),
    queryFn: async () => (await apiClient.get<Sinistralite>("/api/sinistres", { params: { debut, fin } })).data,
    enabled: actif && Boolean(debut && fin && debut <= fin),
    staleTime: 60_000,
  });
}

/** Volet sinistre d'un incident ; null s'il n'y en a pas encore (réponse 204). */
export function useSinistre(idIncident: number | null) {
  return useQuery({
    queryKey: fiabiliteKeys.sinistre(idIncident ?? 0),
    queryFn: async () => {
      const { data, status } = await apiClient.get<Sinistre>(`/api/incidents/${idIncident}/sinistre`);
      return status === 204 || !data ? null : data;
    },
    enabled: idIncident !== null,
  });
}

export function useEnregistrerSinistre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idIncident, requete }: { idIncident: number; requete: EnregistrerSinistreRequest }) =>
      (await apiClient.put<Sinistre>(`/api/incidents/${idIncident}/sinistre`, requete)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fiabiliteKeys.tout }),
  });
}

export function useSupprimerSinistre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idIncident: number) => {
      await apiClient.delete(`/api/incidents/${idIncident}/sinistre`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fiabiliteKeys.tout }),
  });
}
