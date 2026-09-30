import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Adoption, JournalConnexion, QualiteDonnees } from "@/types/suivi-logiciel";

/** Page « Suivi du logiciel » (2026-09-29), capacité ADMINISTRER. */
export function useAdoption(actif = true) {
  return useQuery({
    queryKey: ["suivi-logiciel", "adoption"],
    queryFn: async () => (await apiClient.get<Adoption>("/api/adoption")).data,
    enabled: actif,
  });
}

export function useQualiteDonnees(actif = true) {
  return useQuery({
    queryKey: ["suivi-logiciel", "qualite-donnees"],
    queryFn: async () => (await apiClient.get<QualiteDonnees>("/api/qualite-donnees")).data,
    enabled: actif,
  });
}

export function useConnexions(echecs: boolean, actif = true) {
  return useQuery({
    queryKey: ["suivi-logiciel", "connexions", echecs],
    queryFn: async () => (await apiClient.get<JournalConnexion[]>("/api/connexions", { params: { echecs, limite: 300 } })).data,
    enabled: actif,
  });
}
