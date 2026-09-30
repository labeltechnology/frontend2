import { lirePartsMensuelles } from "@/features/couts/couts";
import { lireNombreFacultatif } from "@/features/performance/reglages-type";
import type { EnregistrerBudgetPosteRequest, LigneBudgetPoste } from "@/types/pilotage";

/** Parts égales (aucune saisie, ou 12 parts à 100/12 près). */
export function partsEgales(parts: number[]): boolean {
  return parts.length !== 12 || parts.every((p) => Math.abs(p - 100 / 12) < 0.01);
}

/** Total des budgets saisis de l'année (carburant compris). */
export function totalBudgets(postes: LigneBudgetPoste[]): number {
  return postes.reduce((s, l) => s + (l.montantAnnuel ?? 0), 0);
}

/**
 * Requête d'enregistrement d'un poste, ou un message d'erreur :
 * montant positif ou nul ; parts facultatives (12, total 100 %).
 */
export function requeteBudgetPoste(
  annee: number,
  ligne: Pick<LigneBudgetPoste, "poste" | "modifiable">,
  montant: string,
  repartir: boolean,
  parts: string[],
): EnregistrerBudgetPosteRequest | string {
  if (!ligne.modifiable) return "Le budget carburant se saisit par type de véhicule, plus bas.";
  const m = lireNombreFacultatif(montant);
  if (m === null || m === undefined) return "Montant annuel : nombre positif attendu.";
  const partsMensuelles = repartir ? lirePartsMensuelles(parts) : null;
  if (typeof partsMensuelles === "string") return partsMensuelles;
  return { annee, poste: ligne.poste, montantAnnuel: m, partsMensuelles };
}
