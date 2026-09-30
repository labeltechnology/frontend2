import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { JournalAudit } from "@/types/audit";

export interface RechercheAuditParams {
  entite?: string;
  idUtilisateur?: number;
  dateDebut?: string;
  dateFin?: string;
}

async function rechercherJournalAudit(params: RechercheAuditParams): Promise<JournalAudit[]> {
  const { data } = await apiClient.get<JournalAudit[]>("/api/journal-audit", { params });
  return data;
}

/**
 * @param enabled Permet de désactiver la requête (ex. widget "Activité récente" du tableau de
 * bord, itération 12) quand l'utilisateur courant n'a pas le rôle requis côté backend (règle
 * 14.5, capacité ADMINISTRER de lib/droits.ts) — évite un appel voué à un 403. Par défaut activé,
 * pour ne rien changer aux appels existants (AuditPage).
 */
export function useJournalAudit(params: RechercheAuditParams, enabled = true) {
  return useQuery({
    queryKey: ["journal-audit", params],
    queryFn: () => rechercherJournalAudit(params),
    enabled,
  });
}
