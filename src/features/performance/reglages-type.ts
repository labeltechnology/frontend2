import { nombreFr } from "@/features/performance/performance";
import { normaliserNombre } from "@/lib/utils";
import type { CategorieEngin, TypeEngin } from "@/types/engin";

/**
 * Réglages « performance » d'un type de véhicule (2026-09-28) : seuils de
 * sous-utilisation et coût de référence. Règles pures, partagées par l'écran
 * Types de véhicule et la page Performance et utilisation.
 */

/** Unité d'usage : heures pour un engin de chantier (compteur horaire), km sinon. */
export function uniteUsage(categorie: CategorieEngin | null | undefined): "km" | "h" {
  return categorie === "ENGIN_CHANTIER" ? "h" : "km";
}

/** « 50 % des jours · 1 500 km/mois · réf. 400 Ar/km », ou « Non réglé ». */
export function resumeReglagesType(t: Pick<TypeEngin, "categorie" | "seuilTauxJours" | "seuilUsageMensuel" | "coutReferenceUnite">): string {
  const unite = uniteUsage(t.categorie);
  const morceaux: string[] = [];
  if (t.seuilTauxJours != null) morceaux.push(`${nombreFr(t.seuilTauxJours, 1)} % des jours`);
  if (t.seuilUsageMensuel != null) morceaux.push(`${nombreFr(t.seuilUsageMensuel, unite === "h" ? 1 : 0)} ${unite}/mois`);
  if (t.coutReferenceUnite != null) morceaux.push(`réf. ${nombreFr(t.coutReferenceUnite, 1)} Ar/${unite}`);
  return morceaux.length ? morceaux.join(" · ") : "Non réglé";
}

/**
 * Nombre facultatif saisi dans un formulaire : undefined si vide, null si
 * invalide (pas un nombre, négatif, ou au-dessus de {@code maximum}).
 *
 * Passe par {@link normaliserNombre} (lib/utils) plutôt que par un
 * `replace(",", ".")` local : celui-ci laissait passer la virgule décimale
 * mais pas les séparateurs de milliers, si bien qu'un montant collé depuis
 * Excel ou un PDF (« 1 500,50 », avec espace insécable) était rejeté comme
 * invalide. Même règle que la saisie des pièces de maintenance.
 */
export function lireNombreFacultatif(texte: string | null | undefined, maximum?: number): number | undefined | null {
  const brut = normaliserNombre(texte ?? "");
  if (brut === "") return undefined;
  const valeur = Number(brut);
  if (!Number.isFinite(valeur) || valeur < 0) return null;
  if (maximum !== undefined && valeur > maximum) return null;
  return valeur;
}

/** Valeur d'un nombre facultatif pour remplir un champ texte. */
export function versChamp(valeur: number | null | undefined): string {
  return valeur == null ? "" : String(valeur);
}
