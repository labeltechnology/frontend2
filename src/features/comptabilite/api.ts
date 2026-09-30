import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parametreSources } from "@/features/comptabilite/comptabilite";
import { apiClient } from "@/lib/api-client";
import type { ApercuExport, ParametresComptables, SourceComptable } from "@/types/comptabilite";

/** Export comptable CSV et plan comptable (2026-09-29). */
export const comptabiliteKeys = {
  apercu: (debut: string, fin: string, sources: SourceComptable[]) => ["comptabilite", "apercu", debut, fin, [...sources].sort()] as const,
  parametres: ["parametres-comptables"] as const,
};

export function useApercuExport(debut: string, fin: string, sources: SourceComptable[], actif: boolean) {
  return useQuery({
    queryKey: comptabiliteKeys.apercu(debut, fin, sources),
    queryFn: async () =>
      (await apiClient.get<ApercuExport>("/api/comptabilite/apercu", { params: { debut, fin, sources: parametreSources(sources) } })).data,
    enabled: actif,
  });
}

/** Télécharge le CSV (le nom de fichier est fixé côté écran : ecritures-debut-fin.csv). */
export function useTelechargerExport() {
  return useMutation({
    mutationFn: async ({ debut, fin, sources }: { debut: string; fin: string; sources: SourceComptable[] }) =>
      (
        await apiClient.get<Blob>("/api/comptabilite/export", {
          params: { debut, fin, sources: parametreSources(sources) },
          responseType: "blob",
        })
      ).data,
  });
}

export function useParametresComptables() {
  return useQuery({
    queryKey: comptabiliteKeys.parametres,
    queryFn: async () => (await apiClient.get<ParametresComptables>("/api/parametres/comptabilite")).data,
  });
}

export function useMettreAJourParametresComptables() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: ParametresComptables) => (await apiClient.put<ParametresComptables>("/api/parametres/comptabilite", p)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(comptabiliteKeys.parametres, data);
      queryClient.invalidateQueries({ queryKey: ["comptabilite"] });
    },
  });
}
