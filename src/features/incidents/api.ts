import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CloturerIncidentRequest, DeclarerIncidentRequest, Incident } from "@/types/incident";

export const incidentsKeys = {
  liste: ["incidents"] as const,
};

async function listerIncidents(): Promise<Incident[]> {
  const { data } = await apiClient.get<Incident[]>("/api/incidents");
  return data;
}

async function declarerIncident(requete: DeclarerIncidentRequest): Promise<Incident> {
  const { data } = await apiClient.post<Incident>("/api/incidents", requete);
  return data;
}

async function assignerResponsable(id: number, idUtilisateur: number): Promise<Incident> {
  const { data } = await apiClient.patch<Incident>(`/api/incidents/${id}/responsable`, null, {
    params: { idUtilisateur },
  });
  return data;
}

async function cloturerIncident(id: number, requete: CloturerIncidentRequest): Promise<Incident> {
  const { data } = await apiClient.patch<Incident>(`/api/incidents/${id}/cloturer`, requete);
  return data;
}

export function useIncidents() {
  return useQuery({ queryKey: incidentsKeys.liste, queryFn: listerIncidents });
}

export function useDeclarerIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: declarerIncident,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentsKeys.liste }),
  });
}

export function useAssignerResponsable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idUtilisateur }: { id: number; idUtilisateur: number }) => assignerResponsable(id, idUtilisateur),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentsKeys.liste }),
  });
}

export function useCloturerIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: CloturerIncidentRequest }) => cloturerIncident(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: incidentsKeys.liste }),
  });
}
