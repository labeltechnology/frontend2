import type { PorteeCategorie } from "@/types/equipement-bord";

/**
 * Échéancier d'entretien (rubrique « Entretien du véhicule » de la fiche de
 * suivi de l'utilisateur, ajoutée le 2026-09-24). L'échéance est calculée
 * par le backend (dernière intervention + intervalle du poste) — le
 * frontend ne fait qu'un aperçu indicatif à la saisie (voir
 * features/entretien/echeance.ts).
 */

export interface PosteEntretien {
  idPosteEntretien: number;
  libelle: string;
  /** Véhicule routier. */
  intervalleKm: number | null;
  /** Engin de chantier (heures moteur). */
  intervalleHeures: number | null;
  intervalleMois: number | null;
  portee: PorteeCategorie;
  ordre: number;
  actif: boolean;
}

export interface CreerPosteEntretienRequest {
  libelle: string;
  intervalleKm?: number;
  intervalleHeures?: number;
  intervalleMois?: number;
  portee: PorteeCategorie;
  ordre: number;
}

export type ModifierPosteEntretienRequest = CreerPosteEntretienRequest;

export type StatutEcheance = "A_RENSEIGNER" | "A_JOUR" | "BIENTOT" | "EN_RETARD";

export interface EcheanceEntretien {
  idPosteEntretien: number;
  libelle: string;
  intervalleCompteur: number | null;
  intervalleMois: number | null;
  uniteCompteur: "km" | "h";
  dateDerniereIntervention: string | null;
  compteurDerniereIntervention: number | null;
  observation: string | null;
  prochaineDate: string | null;
  prochainCompteur: number | null;
  statut: StatutEcheance;
}

/** Dernière intervention connue, saisie sur la fiche de création. */
export interface EntretienInitialRequest {
  idPosteEntretien: number;
  dateDerniereIntervention?: string;
  compteurDerniereIntervention?: number;
  observation?: string;
}

export interface InterventionEntretienRequest {
  dateIntervention: string;
  compteur?: number;
  observation?: string;
}
