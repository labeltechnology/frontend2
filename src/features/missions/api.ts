import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerMissionRequest, Mission, ModifierMissionRequest } from "@/types/mission";

export const missionsKeys = {
  liste: ["missions"] as const,
};

async function listerMissions(): Promise<Mission[]> {
  const { data } = await apiClient.get<Mission[]>("/api/missions");
  return data;
}

async function creerMission(requete: CreerMissionRequest): Promise<Mission> {
  const { data } = await apiClient.post<Mission>("/api/missions", requete);
  return data;
}

async function modifierMission(id: number, requete: ModifierMissionRequest): Promise<Mission> {
  const { data } = await apiClient.put<Mission>(`/api/missions/${id}`, requete);
  return data;
}

/** compteurHeuresDepart : relevé du compteur horaire (engin de chantier, facultatif — 2026-09-28). */
async function demarrerMission(id: number, kilometrageDepart: number, compteurHeuresDepart?: number): Promise<Mission> {
  const { data } = await apiClient.patch<Mission>(`/api/missions/${id}/demarrer`, null, {
    params: { kilometrageDepart, compteurHeuresDepart },
  });
  return data;
}

async function terminerMission(id: number, kilometrageRetour: number, compteurHeuresRetour?: number): Promise<Mission> {
  const { data } = await apiClient.patch<Mission>(`/api/missions/${id}/terminer`, null, {
    params: { kilometrageRetour, compteurHeuresRetour },
  });
  return data;
}

async function annulerMission(id: number, motifAnnulation: string): Promise<Mission> {
  const { data } = await apiClient.patch<Mission>(`/api/missions/${id}/annuler`, null, {
    params: { motifAnnulation },
  });
  return data;
}

export function useMissions() {
  return useQuery({ queryKey: missionsKeys.liste, queryFn: listerMissions });
}

export function useCreerMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerMission,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKeys.liste }),
  });
}

/**
 * Ajouté le 2026-09-24, demande explicite de l'utilisateur : pouvoir créer
 * ET déplacer/modifier une mission directement depuis le planning (voir
 * PlanningRessources, MissionPlanningDialog) — endpoint PUT déjà
 * fonctionnel côté backend (MissionController#modifier), jusque-là
 * inaccessible depuis le frontend.
 */
export function useModifierMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierMissionRequest }) => modifierMission(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKeys.liste }),
  });
}

export function useDemarrerMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kilometrageDepart, compteurHeuresDepart }: { id: number; kilometrageDepart: number; compteurHeuresDepart?: number }) =>
      demarrerMission(id, kilometrageDepart, compteurHeuresDepart),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKeys.liste }),
  });
}

export function useTerminerMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kilometrageRetour, compteurHeuresRetour }: { id: number; kilometrageRetour: number; compteurHeuresRetour?: number }) =>
      terminerMission(id, kilometrageRetour, compteurHeuresRetour),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKeys.liste }),
  });
}

export function useAnnulerMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifAnnulation }: { id: number; motifAnnulation: string }) =>
      annulerMission(id, motifAnnulation),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: missionsKeys.liste }),
  });
}
