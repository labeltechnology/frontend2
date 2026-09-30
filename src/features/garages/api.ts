import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerGarageExterneRequest, GarageExterne, ModifierGarageExterneRequest } from "@/types/garage";

export const garagesKeys = {
  liste: ["garages-externes"] as const,
};

async function listerGarages(): Promise<GarageExterne[]> {
  const { data } = await apiClient.get<GarageExterne[]>("/api/garages-externes");
  return data;
}

async function creerGarage(requete: CreerGarageExterneRequest): Promise<GarageExterne> {
  const { data } = await apiClient.post<GarageExterne>("/api/garages-externes", requete);
  return data;
}

async function modifierGarage(id: number, requete: ModifierGarageExterneRequest): Promise<GarageExterne> {
  const { data } = await apiClient.put<GarageExterne>(`/api/garages-externes/${id}`, requete);
  return data;
}

async function changerActivationGarage(id: number, actif: boolean): Promise<GarageExterne> {
  const { data } = await apiClient.patch<GarageExterne>(`/api/garages-externes/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

export function useGaragesExternes() {
  return useQuery({ queryKey: garagesKeys.liste, queryFn: listerGarages });
}

export function useCreerGarageExterne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerGarage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: garagesKeys.liste }),
  });
}

export function useModifierGarageExterne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierGarageExterneRequest }) =>
      modifierGarage(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: garagesKeys.liste }),
  });
}

export function useChangerActivationGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationGarage(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: garagesKeys.liste }),
  });
}
