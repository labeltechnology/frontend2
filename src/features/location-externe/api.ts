import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ContratLocationExterne, CreerContratLocationRequest } from "@/types/location";

export const contratsLocationKeys = {
  liste: ["contrats-location-externe"] as const,
};

async function listerContrats(): Promise<ContratLocationExterne[]> {
  const { data } = await apiClient.get<ContratLocationExterne[]>("/api/contrats-location-externe");
  return data;
}

async function creerContrat(requete: CreerContratLocationRequest): Promise<ContratLocationExterne> {
  const { data } = await apiClient.post<ContratLocationExterne>("/api/contrats-location-externe", requete);
  return data;
}

async function terminerContrat(id: number, dateFinReelle?: string): Promise<ContratLocationExterne> {
  const { data } = await apiClient.patch<ContratLocationExterne>(
    `/api/contrats-location-externe/${id}/terminer`,
    null,
    { params: dateFinReelle ? { dateFinReelle } : undefined },
  );
  return data;
}

// Préalable à la facturation (règle validée avec l'utilisateur) : montant = tarif journalier × nombre de jours.
async function definirTarifContrat(id: number, tarifJournalier: number): Promise<ContratLocationExterne> {
  const { data } = await apiClient.patch<ContratLocationExterne>(`/api/contrats-location-externe/${id}/tarif`, null, {
    params: { tarifJournalier },
  });
  return data;
}

export function useContratsLocationExterne() {
  return useQuery({ queryKey: contratsLocationKeys.liste, queryFn: listerContrats });
}

export function useCreerContratLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerContrat,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contratsLocationKeys.liste }),
  });
}

export function useTerminerContratLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dateFinReelle }: { id: number; dateFinReelle?: string }) => terminerContrat(id, dateFinReelle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contratsLocationKeys.liste }),
  });
}

export function useDefinirTarifContrat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tarifJournalier }: { id: number; tarifJournalier: number }) =>
      definirTarifContrat(id, tarifJournalier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contratsLocationKeys.liste }),
  });
}
