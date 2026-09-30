import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerFactureProformaRequest, FactureProforma } from "@/types/proforma";

export const facturesProformaKeys = {
  liste: ["factures-proforma"] as const,
};

async function listerProformas(): Promise<FactureProforma[]> {
  const { data } = await apiClient.get<FactureProforma[]>("/api/factures-proforma");
  return data;
}

async function creerProforma(requete: CreerFactureProformaRequest): Promise<FactureProforma> {
  const { data } = await apiClient.post<FactureProforma>("/api/factures-proforma", requete);
  return data;
}

export function useFacturesProforma() {
  return useQuery({ queryKey: facturesProformaKeys.liste, queryFn: listerProformas });
}

export function useCreerFactureProforma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerProforma,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturesProformaKeys.liste }),
  });
}

// --- Aperçu / export PDF (même principe que factures-location/api.ts) ---

async function telechargerProformaPdf(idProforma: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/api/factures-proforma/${idProforma}/export/pdf`, {
    responseType: "blob",
  });
  return data;
}

export function useFactureProformaPdf() {
  return useMutation({ mutationFn: telechargerProformaPdf });
}
