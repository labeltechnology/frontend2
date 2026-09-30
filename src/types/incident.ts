import type { PrioriteAlerte } from "@/types/alerte";
import type { Conducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";

/** DEGATS (V64, 2026-09-29) : dégâts constatés au retour d'un chantier. */
export type TypeIncident = "ACCIDENT" | "PANNE" | "VOL" | "AUTRE" | "DEGATS";
export type StatutIncident = "DECLARE" | "EN_TRAITEMENT" | "CLOTURE";

export interface IncidentPhoto {
  idIncidentPhoto: number;
  cheminFichier: string;
  legende: string | null;
}

export interface Incident {
  idIncident: number;
  engin: Engin;
  conducteur: Conducteur | null;
  idMission: number | null;
  type: TypeIncident;
  gravite: PrioriteAlerte;
  description: string;
  dateSurvenue: string;
  statut: StatutIncident;
  idResponsableTraitement: number | null;
  compteRendu: string | null;
  coutEstime: number | null;
  dateCloture: string | null;
}

export interface DeclarerIncidentRequest {
  idEngin: number;
  idConducteur?: number;
  idMission?: number;
  type: TypeIncident;
  gravite: PrioriteAlerte;
  description: string;
  dateSurvenue: string;
}

export interface AjouterPhotoRequest {
  cheminFichier: string;
  legende?: string;
}

export interface CloturerIncidentRequest {
  compteRendu: string;
  coutEstime?: number;
}
