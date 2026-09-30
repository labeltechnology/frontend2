import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ResultatRecherche } from "@/features/recherche/types";

const DELAI_FRAPPE_MS = 250;

/** Terme stable après une courte pause de frappe (évite un appel par lettre). */
function useTermeStable(terme: string): string {
  const [stable, setStable] = useState(terme);
  useEffect(() => {
    const id = window.setTimeout(() => setStable(terme), DELAI_FRAPPE_MS);
    return () => window.clearTimeout(id);
  }, [terme]);
  return stable;
}

/** GET /api/recherche?q= : véhicules, conducteurs, chantiers, missions dans la portée du rôle (2026-09-30). */
export function useRechercheGlobale(terme: string, actif: boolean) {
  const stable = useTermeStable(terme.trim());
  return useQuery({
    queryKey: ["recherche-globale", stable],
    queryFn: async () => (await apiClient.get<ResultatRecherche>("/api/recherche", { params: { q: stable } })).data,
    enabled: actif && stable.length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
