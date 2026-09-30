import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Affectation, CreerAffectationRequest } from "@/types/affectation";

export const affectationsKeys = {
  liste: ["affectations"] as const,
};

async function listerAffectations(): Promise<Affectation[]> {
  const { data } = await apiClient.get<Affectation[]>("/api/affectations");
  return data;
}

async function creerAffectation(requete: CreerAffectationRequest): Promise<Affectation> {
  const { data } = await apiClient.post<Affectation>("/api/affectations", requete);
  return data;
}

async function terminerAffectation(id: number): Promise<Affectation> {
  const { data } = await apiClient.patch<Affectation>(`/api/affectations/${id}/terminer`);
  return data;
}

async function annulerAffectation(id: number, motifAnnulation: string): Promise<Affectation> {
  const { data } = await apiClient.patch<Affectation>(`/api/affectations/${id}/annuler`, null, {
    params: { motifAnnulation },
  });
  return data;
}

export function useAffectations() {
  return useQuery({ queryKey: affectationsKeys.liste, queryFn: listerAffectations });
}

export function useCreerAffectation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerAffectation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: affectationsKeys.liste }),
  });
}

export function useTerminerAffectation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminerAffectation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: affectationsKeys.liste }),
  });
}

export function useAnnulerAffectation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifAnnulation }: { id: number; motifAnnulation: string }) =>
      annulerAffectation(id, motifAnnulation),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: affectationsKeys.liste }),
  });
}
