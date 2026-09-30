import type { Engin } from "@/types/engin";

/**
 * Libellé d'un véhicule à l'écran (2026-09-25, demande de l'utilisateur :
 * « masque les codes des véhicules, l'immatriculation ou le numéro de série
 * est unique »). Le code interne n'est plus jamais affiché : on montre
 * l'identifiant unique, puis la marque et le modèle — ex. « 1234 TBA —
 * Toyota Hilux ».
 *
 * Point unique côté écran. La source de vérité est le serveur
 * (LibelleVehicule.java → champ `libelleVehicule` des DTO) ; le calcul local
 * n'est qu'un repli, avec la même règle, pour un objet sans ce champ.
 */
export type SourceLibelleVehicule = Partial<
  Pick<Engin, "idEngin" | "immatriculation" | "numeroSerie" | "numeroChassis" | "marque" | "modele" | "libelleVehicule">
>;

function texte(valeur: string | null | undefined): string {
  return valeur?.trim() ?? "";
}

/** Immatriculation (véhicule routier), sinon n° de série (engin de chantier), sinon n° de châssis. */
export function identifiantVehicule(engin: SourceLibelleVehicule | null | undefined): string {
  if (!engin) return "";
  const identifiant = texte(engin.immatriculation) || texte(engin.numeroSerie) || texte(engin.numeroChassis);
  if (identifiant) return identifiant;
  return engin.idEngin != null ? `Véhicule n° ${engin.idEngin}` : "Véhicule";
}

/** « 1234 TBA — Toyota Hilux » ; chaîne vide si aucun véhicule. */
export function libelleVehicule(engin: SourceLibelleVehicule | null | undefined): string {
  if (!engin) return "";
  if (texte(engin.libelleVehicule)) return texte(engin.libelleVehicule);
  const modele = [texte(engin.marque), texte(engin.modele)].filter(Boolean).join(" ");
  const identifiant = identifiantVehicule(engin);
  return modele ? `${identifiant} — ${modele}` : identifiant;
}

/** Tri alphabétique sur le libellé (listes, cartes du planning). */
export function comparerVehicules(a: SourceLibelleVehicule, b: SourceLibelleVehicule): number {
  return libelleVehicule(a).localeCompare(libelleVehicule(b), "fr");
}
