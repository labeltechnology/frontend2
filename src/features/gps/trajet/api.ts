import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Bornes } from "@/features/gps/trajet/periode";
import type { TrajetPeriode } from "@/types/carte-gps";

async function lireTrajet(idDispositifGps: number, bornes: Bornes): Promise<TrajetPeriode> {
  const { data } = await apiClient.get<TrajetPeriode>("/api/gps/trajet", {
    params: { idDispositifGps, debut: bornes.debut, fin: bornes.fin },
  });
  return data;
}

/**
 * Trajet d'un véhicule sur une période, avec ses passages sur chantier
 * (2026-09-30). {@code enDirect} : la période inclut aujourd'hui, relue chaque minute.
 */
export function useTrajetPeriode(idDispositifGps: number | null, bornes: Bornes | null, enDirect = false) {
  return useQuery({
    queryKey: ["gps", "trajet", idDispositifGps, bornes?.debut, bornes?.fin],
    queryFn: () => lireTrajet(idDispositifGps as number, bornes as Bornes),
    enabled: idDispositifGps !== null && bornes !== null,
    refetchInterval: enDirect ? 60_000 : false,
  });
}
