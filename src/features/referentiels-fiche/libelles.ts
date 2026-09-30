import type { CategorieEngin } from "@/types/engin";
import type { CategorieElementBord, PorteeCategorie } from "@/types/equipement-bord";

/** Libellés de la portée d'un élément de référentiel de la fiche (élément de bord, poste d'entretien). */
export const LIBELLES_PORTEE: Record<PorteeCategorie, string> = {
  TOUS: "Tous les véhicules",
  VEHICULE_ROUTIER: "Véhicules routiers",
  ENGIN_CHANTIER: "Engins de chantier",
};

/** Même règle que PorteeCategorie#concerne côté backend. */
export function porteeConcerne(portee: PorteeCategorie, categorie: CategorieEngin | undefined): boolean {
  return portee === "TOUS" || portee === categorie;
}

/** Rubrique de la fiche dans laquelle un élément de bord apparaît. */
export const LIBELLES_CATEGORIE_ELEMENT: Record<CategorieElementBord, string> = {
  SECURITE: "Élément de sécurité",
  OUTIL: "Boîte à outils",
};
