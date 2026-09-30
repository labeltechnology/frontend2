import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerFactureLocationEntranteRequest, FactureLocationEntrante } from "@/types/location-entrante";

export const facturesLocationEntranteKeys = {
  liste: (idContrat?: number) => ["factures-location-entrante", idContrat ?? "toutes"] as const,
};

async function listerFactures(idContrat?: number): Promise<FactureLocationEntrante[]> {
  const { data } = await apiClient.get<FactureLocationEntrante[]>("/api/factures-location-entrante", {
    params: idContrat ? { idContrat } : undefined,
  });
  return data;
}

async function creerFacture(requete: CreerFactureLocationEntranteRequest): Promise<FactureLocationEntrante> {
  const { data } = await apiClient.post<FactureLocationEntrante>("/api/factures-location-entrante", requete);
  return data;
}

async function marquerFacturePayee(id: number, datePaiement?: string): Promise<FactureLocationEntrante> {
  const { data } = await apiClient.patch<FactureLocationEntrante>(`/api/factures-location-entrante/${id}/payer`, null, {
    params: datePaiement ? { datePaiement } : undefined,
  });
  return data;
}

async function annulerFacture(id: number): Promise<FactureLocationEntrante> {
  const { data } = await apiClient.patch<FactureLocationEntrante>(`/api/factures-location-entrante/${id}/annuler`);
  return data;
}

export function useFacturesLocationEntrante(idContrat?: number) {
  return useQuery({
    queryKey: facturesLocationEntranteKeys.liste(idContrat),
    queryFn: () => listerFactures(idContrat),
    enabled: idContrat !== undefined,
  });
}

export function useCreerFactureLocationEntrante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerFacture,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-location-entrante"] }),
  });
}

export function useMarquerFactureLocationEntrantePayee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datePaiement }: { id: number; datePaiement?: string }) => marquerFacturePayee(id, datePaiement),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-location-entrante"] }),
  });
}

export function useAnnulerFactureLocationEntrante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: annulerFacture,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-location-entrante"] }),
  });
}
