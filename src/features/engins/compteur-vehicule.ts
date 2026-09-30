import { formatNombre, normaliserNombre } from "@/lib/utils";
import type { Engin } from "@/types/engin";

/**
 * Compteur à afficher pour un véhicule (2026-09-25, « afficher l'heure des
 * engins » dans la liste) : heures de fonctionnement pour un engin de
 * chantier (compteur horaire), kilomètres pour un véhicule routier.
 */
export function compteurVehicule(engin: Pick<Engin, "kilometrage" | "compteurHeures" | "typeEngin">): string {
  return engin.typeEngin?.categorie === "ENGIN_CHANTIER"
    ? `${formatNombre(engin.compteurHeures ?? 0)} h`
    : `${formatNombre(engin.kilometrage ?? 0)} km`;
}

/**
 * Vrai pour un engin de chantier : son compteur horaire est demandé à la
 * saisie carburant et au démarrage / à la fin d'une mission (2026-09-28,
 * performance et utilisation).
 */
export function aCompteurHoraire(engin: Pick<Engin, "typeEngin"> | null | undefined): boolean {
  return engin?.typeEngin?.categorie === "ENGIN_CHANTIER";
}

/**
 * Compteur horaire saisi : undefined si le champ est vide (relevé
 * facultatif), null si la saisie n'est pas un nombre positif ou nul.
 */
export function lireCompteurHeures(texte: string): number | undefined | null {
  // normaliserNombre plutôt qu'un trim + virgule : un relevé copié depuis un
  // tableur (« 1 250,5 ») contient un séparateur de milliers, que cette
  // fonction rejetait comme invalide.
  const brut = normaliserNombre(texte);
  if (brut === "") return undefined;
  const valeur = Number(brut);
  return Number.isFinite(valeur) && valeur >= 0 ? valeur : null;
}
