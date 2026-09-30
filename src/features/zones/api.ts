import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerZoneGeographiqueRequest, ZoneGeographique } from "@/types/zone";

export const zonesKeys = {
  liste: ["zones"] as const,
};

async function listerZones(): Promise<ZoneGeographique[]> {
  const { data } = await apiClient.get<ZoneGeographique[]>("/api/zones");
  return data;
}

async function creerZone(requete: CreerZoneGeographiqueRequest): Promise<ZoneGeographique> {
  const { data } = await apiClient.post<ZoneGeographique>("/api/zones", requete);
  return data;
}

async function desactiverZone(id: number): Promise<ZoneGeographique> {
  const { data } = await apiClient.patch<ZoneGeographique>(`/api/zones/${id}/desactiver`);
  return data;
}

async function activerZone(id: number): Promise<ZoneGeographique> {
  const { data } = await apiClient.patch<ZoneGeographique>(`/api/zones/${id}/activer`);
  return data;
}

export function useZones() {
  return useQuery({ queryKey: zonesKeys.liste, queryFn: listerZones });
}

export function useCreerZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerZone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zonesKeys.liste }),
  });
}

export function useDesactiverZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: desactiverZone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zonesKeys.liste }),
  });
}

export function useActiverZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activerZone,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zonesKeys.liste }),
  });
}
