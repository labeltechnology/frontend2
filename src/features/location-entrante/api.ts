import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ContratLocationEntrante, CreerContratLocationEntranteRequest } from "@/types/location-entrante";

export const contratsLocationEntranteKeys = {
  liste: ["contrats-location-entrante"] as const,
};

async function listerContrats(): Promise<ContratLocationEntrante[]> {
  const { data } = await apiClient.get<ContratLocationEntrante[]>("/api/contrats-location-entrante");
  return data;
}

async function creerContrat(requete: CreerContratLocationEntranteRequest): Promise<ContratLocationEntrante> {
  const { data } = await apiClient.post<ContratLocationEntrante>("/api/contrats-location-entrante", requete);
  return data;
}

async function terminerContrat(id: number, dateFinReelle?: string): Promise<ContratLocationEntrante> {
  const { data } = await apiClient.patch<ContratLocationEntrante>(
    `/api/contrats-location-entrante/${id}/terminer`,
    null,
    { params: dateFinReelle ? { dateFinReelle } : undefined },
  );
  return data;
}

// Préalable à la facturation : montant dû au prestataire = tarif journalier × nombre de jours.
async function definirTarifContrat(id: number, tarifJournalier: number): Promise<ContratLocationEntrante> {
  const { data } = await apiClient.patch<ContratLocationEntrante>(
    `/api/contrats-location-entrante/${id}/tarif`,
    null,
    { params: { tarifJournalier } },
  );
  return data;
}

export function useContratsLocationEntrante() {
  return useQuery({ queryKey: contratsLocationEntranteKeys.liste, queryFn: listerContrats });
}

export function useCreerContratLocationEntrante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerContrat,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contratsLocationEntranteKeys.liste }),
  });
}

export function useTerminerContratLocationEntrante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dateFinReelle }: { id: number; dateFinReelle?: string }) => terminerContrat(id, dateFinReelle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contratsLocationEntranteKeys.liste }),
  });
}

export function useDefinirTarifContratEntrante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tarifJournalier }: { id: number; tarifJournalier: number }) =>
      definirTarifContrat(id, tarifJournalier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contratsLocationEntranteKeys.liste }),
  });
}
