/**
 * Éléments de bord de la fiche véhicule (rubriques « Éléments de sécurité »
 * et « Boîte à outils » de la fiche de suivi de l'utilisateur, ajoutées le
 * 2026-09-24). Calqués sur les DTO du package backend `equipementbord`.
 */

/** À quelle catégorie de véhicule un élément de référentiel s'applique (PorteeCategorie côté backend). */
export type PorteeCategorie = "TOUS" | "VEHICULE_ROUTIER" | "ENGIN_CHANTIER";

export type CategorieElementBord = "SECURITE" | "OUTIL";

export interface ElementBord {
  idElementBord: number;
  libelle: string;
  categorie: CategorieElementBord;
  portee: PorteeCategorie;
  ordre: number;
  actif: boolean;
}

export interface CreerElementBordRequest {
  libelle: string;
  categorie: CategorieElementBord;
  portee: PorteeCategorie;
  ordre: number;
}

export type ModifierElementBordRequest = CreerElementBordRequest;

/** État d'un élément sur un engin ; `present === null` : jamais contrôlé. */
export interface EquipementBord {
  idElementBord: number;
  libelle: string;
  categorie: CategorieElementBord;
  ordre: number;
  present: boolean | null;
  observation: string | null;
  dateControle: string | null;
}

export interface SaisieEquipementBordRequest {
  idElementBord: number;
  present: boolean;
  observation?: string;
}
