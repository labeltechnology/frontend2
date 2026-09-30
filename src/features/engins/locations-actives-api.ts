import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** Véhicule en location en ce moment : loué À une société ou CHEZ un prestataire (2026-09-30). */
export interface LocationActive {
  idEngin: number;
  loueA: string | null;
  loueChez: string | null;
}

async function listerLocationsActives(): Promise<LocationActive[]> {
  const { data } = await apiClient.get<LocationActive[]>("/api/engins/locations-actives");
  return data;
}

/** Pour la liste des véhicules : seulement le nom du tiers, sans tarif ni contrat (réservés aux finances). */
export function useLocationsActives() {
  return useQuery({ queryKey: ["engins", "locations-actives"], queryFn: listerLocationsActives });
}
