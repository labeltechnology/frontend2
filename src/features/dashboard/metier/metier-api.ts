import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { facturesGarageKeys } from "@/features/factures-garage/api";
import { facturesLocationKeys } from "@/features/factures-location/api";
import { facturesLocationEntranteKeys } from "@/features/factures-location-entrante/api";
import type { FactureLocation } from "@/types/location";
import type { FactureLocationEntrante } from "@/types/location-entrante";
import type { FactureGarage } from "@/types/maintenance";

/**
 * Toutes les factures (sans filtre de garage ou de contrat) pour le tableau
 * de bord des finances (2026-09-30). Mêmes clés que les listes des pages :
 * payer ou annuler une facture rafraîchit aussi le tableau de bord.
 * `actif` : seulement pour les rôles qui voient les finances (sinon 403).
 */
export function useToutesFacturesGarage(actif: boolean) {
  return useQuery({
    queryKey: facturesGarageKeys.liste(),
    queryFn: async () => (await apiClient.get<FactureGarage[]>("/api/factures-garage")).data,
    enabled: actif,
  });
}

export function useToutesFacturesLocation(actif: boolean) {
  return useQuery({
    queryKey: facturesLocationKeys.liste(),
    queryFn: async () => (await apiClient.get<FactureLocation[]>("/api/factures-location")).data,
    enabled: actif,
  });
}

export function useToutesFacturesLocationEntrante(actif: boolean) {
  return useQuery({
    queryKey: facturesLocationEntranteKeys.liste(),
    queryFn: async () => (await apiClient.get<FactureLocationEntrante[]>("/api/factures-location-entrante")).data,
    enabled: actif,
  });
}
