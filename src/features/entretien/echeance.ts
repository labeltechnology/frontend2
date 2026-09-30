import { addMonths, format, parseISO } from "date-fns";
import type { BadgeProps } from "@/components/ui/badge";
import { formatDate, formatNombre } from "@/lib/utils";
import type { CategorieEngin } from "@/types/engin";
import type { PosteEntretien, StatutEcheance } from "@/types/entretien";

export const LIBELLES_STATUT_ECHEANCE: Record<StatutEcheance, string> = {
  A_RENSEIGNER: "À renseigner",
  A_JOUR: "À jour",
  BIENTOT: "Bientôt",
  EN_RETARD: "En retard",
};

export const VARIANTE_STATUT_ECHEANCE: Record<StatutEcheance, BadgeProps["variant"]> = {
  A_RENSEIGNER: "outline",
  A_JOUR: "success",
  BIENTOT: "warning",
  EN_RETARD: "destructive",
};

export function uniteCompteur(categorie: CategorieEngin | undefined): "km" | "h" {
  return categorie === "ENGIN_CHANTIER" ? "h" : "km";
}

export function intervalleCompteur(poste: PosteEntretien, categorie: CategorieEngin | undefined): number | null {
  return categorie === "ENGIN_CHANTIER" ? poste.intervalleHeures : poste.intervalleKm;
}

/** « tous les 10 000 km ou 6 mois » — rappel de la règle du poste. */
export function decrireIntervalle(poste: PosteEntretien, categorie: CategorieEngin | undefined): string {
  const morceaux: string[] = [];
  const compteur = intervalleCompteur(poste, categorie);
  if (compteur != null) morceaux.push(`${formatNombre(compteur)} ${uniteCompteur(categorie)}`);
  if (poste.intervalleMois != null) morceaux.push(`${poste.intervalleMois} mois`);
  return morceaux.length > 0 ? `tous les ${morceaux.join(" ou ")}` : "sans intervalle";
}

/** « le 01/12/2026 ou à 90 000 km » ; null si rien à afficher. */
export function decrireEcheance(
  prochaineDate: string | null | undefined,
  prochainCompteur: number | null | undefined,
  unite: "km" | "h",
): string | null {
  const morceaux: string[] = [];
  if (prochaineDate) morceaux.push(`le ${formatDate(prochaineDate)}`);
  if (prochainCompteur != null) morceaux.push(`à ${formatNombre(prochainCompteur)} ${unite}`);
  return morceaux.length > 0 ? morceaux.join(" ou ") : null;
}

/**
 * Aperçu, pendant la saisie, de l'échéance que le backend calculera
 * (EcheanceEntretien#recalculer) : dernière intervention + intervalle. Le
 * calcul qui fait foi reste celui du serveur.
 */
export function apercuEcheance(
  poste: PosteEntretien,
  categorie: CategorieEngin | undefined,
  dateDerniere: string | undefined,
  compteurDernier: number | undefined,
): string | null {
  const prochaineDate =
    dateDerniere && poste.intervalleMois != null
      ? format(addMonths(parseISO(dateDerniere), poste.intervalleMois), "yyyy-MM-dd")
      : null;
  const intervalle = intervalleCompteur(poste, categorie);
  const prochainCompteur = compteurDernier != null && intervalle != null ? compteurDernier + intervalle : null;
  return decrireEcheance(prochaineDate, prochainCompteur, uniteCompteur(categorie));
}
