import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerFactureLocationRequest, FactureLocation } from "@/types/location";

export const facturesLocationKeys = {
  liste: (idContrat?: number) => ["factures-location", idContrat ?? "toutes"] as const,
};

async function listerFactures(idContrat?: number): Promise<FactureLocation[]> {
  const { data } = await apiClient.get<FactureLocation[]>("/api/factures-location", {
    params: idContrat ? { idContrat } : undefined,
  });
  return data;
}

async function creerFacture(requete: CreerFactureLocationRequest): Promise<FactureLocation> {
  const { data } = await apiClient.post<FactureLocation>("/api/factures-location", requete);
  return data;
}

async function marquerFacturePayee(id: number, datePaiement?: string): Promise<FactureLocation> {
  const { data } = await apiClient.patch<FactureLocation>(`/api/factures-location/${id}/payer`, null, {
    params: datePaiement ? { datePaiement } : undefined,
  });
  return data;
}

async function annulerFacture(id: number): Promise<FactureLocation> {
  const { data } = await apiClient.patch<FactureLocation>(`/api/factures-location/${id}/annuler`);
  return data;
}

export function useFacturesLocation(idContrat?: number) {
  return useQuery({
    queryKey: facturesLocationKeys.liste(idContrat),
    queryFn: () => listerFactures(idContrat),
    enabled: idContrat !== undefined,
  });
}

export function useCreerFactureLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerFacture,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-location"] }),
  });
}

export function useMarquerFacturePayee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datePaiement }: { id: number; datePaiement?: string }) => marquerFacturePayee(id, datePaiement),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-location"] }),
  });
}

export function useAnnulerFactureLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: annulerFacture,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-location"] }),
  });
}

// --- Aperçu / export PDF (demande explicite de l'utilisateur : « il faut une apercu du facture de location ») ---

async function telechargerFacturePdf(idFacture: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/api/factures-location/${idFacture}/export/pdf`, {
    responseType: "blob",
  });
  return data;
}

export function useFactureLocationPdf() {
  return useMutation({ mutationFn: telechargerFacturePdf });
}
