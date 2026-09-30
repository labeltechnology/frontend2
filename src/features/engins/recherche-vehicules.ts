import { libelleEnum } from "@/lib/utils";
import type { Engin } from "@/types/engin";

/**
 * Recherche dans la liste et le planning des véhicules (2026-09-25, demande
 * de l'utilisateur : « sur la page liste et planning de véhicule ajouter une
 * zone de recherche »). Logique pure, testable seule.
 *
 * Champs cherchés : immatriculation, n° de série, n° de châssis, marque,
 * modèle, type de véhicule et statut (« en panne », « disponible »…). Le code
 * interne n'est pas cherché : il n'est plus affiché.
 * Insensible à la casse et aux accents. Plusieurs mots = tous doivent être
 * trouvés (« toyota panne » → les Toyota en panne).
 */
export function normaliserTexte(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function texteCherchable(engin: Engin): string {
  return normaliserTexte(
    [
      engin.immatriculation,
      engin.numeroSerie,
      engin.numeroChassis,
      engin.marque,
      engin.modele,
      engin.typeEngin?.libelle,
      libelleEnum(engin.statut),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function filtrerVehicules(engins: readonly Engin[], terme: string): Engin[] {
  const mots = normaliserTexte(terme).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return [...engins];
  return engins.filter((engin) => {
    const texte = texteCherchable(engin);
    return mots.every((mot) => texte.includes(mot));
  });
}
