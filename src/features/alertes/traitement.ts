import type { Alerte } from "@/types/alerte";
import { formatDateTime } from "@/lib/utils";

/**
 * Comment une alerte (ou un groupe d'alertes) a été traitée (2026-09-30) :
 * encore ouverte, traitée par une personne, ou close automatiquement par le
 * système parce que sa cause a disparu. Logique pure, sans React.
 */
export type EtatTraitement = "OUVERTE" | "MANUELLE" | "AUTOMATIQUE";

export function etatTraitement(alertes: readonly Alerte[]): EtatTraitement {
  if (alertes.length === 0 || alertes.some((a) => !a.traitee)) return "OUVERTE";
  return alertes.every((a) => a.traitementAutomatique) ? "AUTOMATIQUE" : "MANUELLE";
}

/** Motif de la clôture automatique la plus récente du groupe ; null s'il n'y en a pas. */
export function motifTraitement(alertes: readonly Alerte[]): string | null {
  const auto = alertes
    .filter((a) => a.traitee && a.traitementAutomatique && a.motifTraitement)
    .sort((x, y) => (y.dateTraitement ?? "").localeCompare(x.dateTraitement ?? ""));
  return auto[0]?.motifTraitement ?? null;
}

export const LIBELLES_ETAT_TRAITEMENT: Record<EtatTraitement, string> = {
  OUVERTE: "À traiter",
  MANUELLE: "Traitée",
  AUTOMATIQUE: "Clôturée automatiquement",
};

/** « À traiter », « Traitée le 30/09/2026 10:15 » ou « Close automatiquement le … : <motif> ». */
export function texteSuivi(alerte: Alerte): string {
  if (!alerte.traitee) return "À traiter";
  const le = alerte.dateTraitement ? ` le ${formatDateTime(alerte.dateTraitement)}` : "";
  if (alerte.traitementAutomatique) {
    return `Clôturée automatiquement${le}${alerte.motifTraitement ? ` : ${alerte.motifTraitement}` : ""}`;
  }
  return `Traitée${le}`;
}

/** Message après « Vérifier les causes ». */
export function messageVerification(closes: number): string {
  if (closes === 0) return "Aucune alerte à clore : les causes sont toujours présentes";
  return closes === 1 ? "1 alerte close : sa cause a disparu" : `${closes} alertes closes : leur cause a disparu`;
}
