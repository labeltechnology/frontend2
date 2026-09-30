import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreerPrestataireLocationRequest,
  ModifierPrestataireLocationRequest,
  PrestataireLocation,
} from "@/types/prestataire-location";

export const prestatairesLocationKeys = {
  liste: ["prestataires-location"] as const,
};

async function listerPrestataires(): Promise<PrestataireLocation[]> {
  const { data } = await apiClient.get<PrestataireLocation[]>("/api/prestataires-location");
  return data;
}

async function creerPrestataire(requete: CreerPrestataireLocationRequest): Promise<PrestataireLocation> {
  const { data } = await apiClient.post<PrestataireLocation>("/api/prestataires-location", requete);
  return data;
}

async function modifierPrestataire(
  id: number,
  requete: ModifierPrestataireLocationRequest,
): Promise<PrestataireLocation> {
  const { data } = await apiClient.put<PrestataireLocation>(`/api/prestataires-location/${id}`, requete);
  return data;
}

async function changerActivationPrestataire(id: number, actif: boolean): Promise<PrestataireLocation> {
  const { data } = await apiClient.patch<PrestataireLocation>(`/api/prestataires-location/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

export function usePrestatairesLocation() {
  return useQuery({ queryKey: prestatairesLocationKeys.liste, queryFn: listerPrestataires });
}

export function useCreerPrestataireLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerPrestataire,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prestatairesLocationKeys.liste }),
  });
}

export function useModifierPrestataireLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierPrestataireLocationRequest }) =>
      modifierPrestataire(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prestatairesLocationKeys.liste }),
  });
}

export function useChangerActivationPrestataireLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationPrestataire(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: prestatairesLocationKeys.liste }),
  });
}
