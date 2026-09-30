import type { CategorieElementBord } from "@/types/equipement-bord";

/**
 * Historique du véhicule (V44, 2026-09-25) — calqué sur les DTO backend
 * `equipementbord.historique.ControleBordHistoriqueDto` et
 * `entretien.historique.InterventionEntretienHistoriqueDto`.
 */
export interface ControleBordHistorique {
  idControle: number;
  idElementBord: number;
  libelle: string;
  categorie: CategorieElementBord;
  present: boolean;
  observation: string | null;
  /** « yyyy-MM-dd ». */
  dateControle: string;
  /** Horodatage d'enregistrement (ISO) ; null pour les lignes reprises sans date connue. */
  dateSaisie: string | null;
}

export type OrigineIntervention = "FICHE_CREATION" | "SAISIE" | "MAINTENANCE" | "REPRISE";

export interface InterventionEntretienHistorique {
  idIntervention: number;
  idPosteEntretien: number;
  libellePoste: string;
  dateIntervention: string | null;
  compteur: number | null;
  unite: "km" | "h";
  observation: string | null;
  origine: OrigineIntervention;
  dateSaisie: string | null;
}
