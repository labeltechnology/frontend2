import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Alerte } from "@/types/alerte";

export const alertesKeys = {
  liste: (nonTraitees: boolean) => ["alertes", { nonTraitees }] as const,
};

async function listerAlertes(nonTraitees: boolean): Promise<Alerte[]> {
  const { data } = await apiClient.get<Alerte[]>("/api/alertes", {
    params: nonTraitees ? { nonTraitees: true } : undefined,
  });
  return data;
}

async function traiterAlerte(id: number): Promise<Alerte> {
  const { data } = await apiClient.patch<Alerte>(`/api/alertes/${id}/traiter`);
  return data;
}

/** Traitement groupé (2026-09-28) : toutes les alertes d'un groupe en un appel ; les déjà traitées sont ignorées. */
async function traiterAlertesGroupe(ids: number[]): Promise<Alerte[]> {
  const { data } = await apiClient.post<Alerte[]>("/api/alertes/traitement-groupe", { ids });
  return data;
}

export function useAlertes(nonTraitees: boolean) {
  return useQuery({ queryKey: alertesKeys.liste(nonTraitees), queryFn: () => listerAlertes(nonTraitees) });
}

export function useTraiterAlertesGroupe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: traiterAlertesGroupe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertes"] }),
  });
}

export function useTraiterAlerte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: traiterAlerte,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertes"] }),
  });
}

/** Résultat de « Vérifier les causes » (2026-09-30). */
export interface ResultatResolution {
  alertesCloses: number;
}

/**
 * Lance tout de suite la clôture automatique (sinon faite toutes les 15 min
 * par le serveur) : utile juste après avoir renouvelé un document ou
 * planifié une maintenance.
 */
async function verifierCauses(): Promise<ResultatResolution> {
  const { data } = await apiClient.post<ResultatResolution>("/api/alertes/resolution-automatique");
  return data;
}

export function useVerifierCauses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifierCauses,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alertes"] }),
  });
}
