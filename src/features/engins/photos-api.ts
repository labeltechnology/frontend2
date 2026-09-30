import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { EnginPhoto } from "@/types/engin";

export const enginPhotosKeys = {
  liste: (idEngin: number) => ["engins", idEngin, "photos"] as const,
};

async function listerPhotos(idEngin: number): Promise<EnginPhoto[]> {
  const { data } = await apiClient.get<EnginPhoto[]>(`/api/engins/${idEngin}/photos`);
  return data;
}

/**
 * Exportée (2026-09-24) pour la fiche de création d'un engin : les photos
 * choisies avant que l'engin existe sont envoyées juste après sa création,
 * quand son identifiant est connu (voir televerserPhotosInitiales).
 */
export async function ajouterPhoto(idEngin: number, fichier: File, principale: boolean): Promise<EnginPhoto> {
  const formData = new FormData();
  formData.append("fichier", fichier);
  // apiClient impose "Content-Type: application/json" par défaut (voir api-client.ts) : on le neutralise ici
  // pour laisser le navigateur générer lui-même l'en-tête multipart/form-data avec sa frontière (boundary) —
  // un Content-Type fixé explicitement sans boundary casserait le parsing multipart côté serveur.
  const { data } = await apiClient.post<EnginPhoto>(`/api/engins/${idEngin}/photos`, formData, {
    params: { principale },
    headers: { "Content-Type": undefined },
  });
  return data;
}

async function definirPhotoPrincipale(idEngin: number, idPhoto: number): Promise<EnginPhoto> {
  const { data } = await apiClient.patch<EnginPhoto>(`/api/engins/${idEngin}/photos/${idPhoto}/principale`);
  return data;
}

async function supprimerPhoto(idEngin: number, idPhoto: number): Promise<void> {
  await apiClient.delete(`/api/engins/${idEngin}/photos/${idPhoto}`);
}

export function useEnginPhotos(idEngin: number | undefined) {
  return useQuery({
    queryKey: enginPhotosKeys.liste(idEngin ?? 0),
    queryFn: () => listerPhotos(idEngin as number),
    enabled: idEngin !== undefined,
  });
}

export function useAjouterEnginPhoto(idEngin: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fichier, principale }: { fichier: File; principale: boolean }) =>
      ajouterPhoto(idEngin as number, fichier, principale),
    onSuccess: () => {
      if (idEngin !== undefined) {
        queryClient.invalidateQueries({ queryKey: enginPhotosKeys.liste(idEngin) });
      }
    },
  });
}

export function useDefinirPhotoPrincipale(idEngin: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idPhoto: number) => definirPhotoPrincipale(idEngin as number, idPhoto),
    onSuccess: () => {
      if (idEngin !== undefined) {
        queryClient.invalidateQueries({ queryKey: enginPhotosKeys.liste(idEngin) });
      }
    },
  });
}

export function useSupprimerEnginPhoto(idEngin: number | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idPhoto: number) => supprimerPhoto(idEngin as number, idPhoto),
    onSuccess: () => {
      if (idEngin !== undefined) {
        queryClient.invalidateQueries({ queryKey: enginPhotosKeys.liste(idEngin) });
      }
    },
  });
}
