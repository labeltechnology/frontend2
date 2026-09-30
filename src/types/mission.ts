import type { Conducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";

export type StatutMission = "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

export interface Mission {
  idMission: number;
  motif: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle: string | null;
  dateFinReelle: string | null;
  kilometrageDepart: number | null;
  kilometrageRetour: number | null;
  /** Compteur horaire au départ et au retour (engin de chantier, facultatif — 2026-09-28). */
  compteurHeuresDepart?: number | null;
  compteurHeuresRetour?: number | null;
  motifAnnulation: string | null;
  statut: StatutMission;
  engin: Engin;
  conducteur: Conducteur;
}

export interface CreerMissionRequest {
  motif: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  idEngin: number;
  idConducteur: number;
}

/**
 * Même forme que CreerMissionRequest (voir MissionController#modifier côté
 * backend : PUT /api/missions/{id}, motif + dates prévues + engin +
 * conducteur — le statut et les champs "réels" ne se modifient pas par ce
 * endpoint, seulement via demarrer/terminer/annuler). Ajouté le 2026-09-24,
 * demande explicite de l'utilisateur : pouvoir créer/déplacer une mission
 * directement depuis le planning (voir PlanningRessources,
 * MissionPlanningDialog).
 */
export interface ModifierMissionRequest {
  motif: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  idEngin: number;
  idConducteur: number;
}
