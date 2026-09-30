import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerFactureGarageRequest, FactureGarage } from "@/types/maintenance";

export const facturesGarageKeys = {
  liste: (idGarageExterne?: number) => ["factures-garage", idGarageExterne ?? "toutes"] as const,
};

async function listerFactures(idGarageExterne?: number): Promise<FactureGarage[]> {
  const { data } = await apiClient.get<FactureGarage[]>("/api/factures-garage", {
    params: idGarageExterne ? { idGarageExterne } : undefined,
  });
  return data;
}

async function creerFacture(requete: CreerFactureGarageRequest): Promise<FactureGarage> {
  const { data } = await apiClient.post<FactureGarage>("/api/factures-garage", requete);
  return data;
}

async function marquerFacturePayee(id: number, datePaiement?: string): Promise<FactureGarage> {
  const { data } = await apiClient.patch<FactureGarage>(`/api/factures-garage/${id}/payer`, null, {
    params: datePaiement ? { datePaiement } : undefined,
  });
  return data;
}

async function annulerFacture(id: number): Promise<FactureGarage> {
  const { data } = await apiClient.patch<FactureGarage>(`/api/factures-garage/${id}/annuler`);
  return data;
}

export function useFacturesGarage(idGarageExterne?: number) {
  return useQuery({
    queryKey: facturesGarageKeys.liste(idGarageExterne),
    queryFn: () => listerFactures(idGarageExterne),
    enabled: idGarageExterne !== undefined,
  });
}

export function useCreerFactureGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerFacture,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-garage"] }),
  });
}

export function useMarquerFactureGaragePayee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datePaiement }: { id: number; datePaiement?: string }) => marquerFacturePayee(id, datePaiement),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-garage"] }),
  });
}

export function useAnnulerFactureGarage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: annulerFacture,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-garage"] }),
  });
}
