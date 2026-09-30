import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ChantierCarte } from "@/types/carte-gps";

export const carteChantiersKeys = {
  liste: ["gps", "carte-chantiers"] as const,
};

async function listerChantiersCarte(): Promise<ChantierCarte[]> {
  const { data } = await apiClient.get<ChantierCarte[]>("/api/carte/chantiers");
  return data;
}

/** Chantiers planifiés et en cours pour la carte GPS (2026-09-30) ; relus chaque minute (situation des véhicules). */
export function useChantiersCarte(actif = true) {
  return useQuery({
    queryKey: carteChantiersKeys.liste,
    queryFn: listerChantiersCarte,
    enabled: actif,
    refetchInterval: 60_000,
  });
}
