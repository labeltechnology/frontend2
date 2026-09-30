import type { StatutEngin } from "@/types/engin";

export type StatutDispositifGps = "ACTIF" | "INACTIF" | "HORS_SERVICE";

export interface DispositifGps {
  idDispositifGps: number;
  numeroSerie: string;
  statut: StatutDispositifGps;
  dateInstallation: string | null;
  derniereTransmission: string | null;
  idEngin: number;
  /** Libellé du véhicule (le code n'est plus affiché) ; null si le boîtier n'est pas posé. */
  libelleVehicule: string | null;
}

export interface CreerDispositifGpsRequest {
  numeroSerie: string;
  idEngin: number;
  dateInstallation?: string;
}

export interface PositionGps {
  idPositionGps: number;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
  idDispositifGps: number;
  idMission: number | null;
}

export interface EnregistrerPositionRequest {
  idDispositifGps: number;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
  idMission?: number;
}

export interface Trajet {
  idTrajet: number;
  idMission: number;
  idDispositifGps: number;
  dateDebut: string;
  dateFin: string | null;
  distanceParcourueKm: number | null;
  vitesseMoyenne: number | null;
  vitesseMaximaleConstatee: number | null;
}

/** Dernière position connue d'un véhicule équipé d'un dispositif GPS ACTIF — alimente la carte "flotte". */
export interface PositionFlotte {
  idDispositifGps: number;
  numeroSerie: string;
  idEngin: number;
  /** Libellé du véhicule (le code n'est plus affiché). */
  libelleVehicule: string;
  statutEngin: StatutEngin;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
}

/** Situation GPS d'un véhicule (carte « Localisation » du rapport véhicule, 2026-09-28). */
export type EtatLocalisationGps = "NON_EQUIPE" | "INACTIF" | "HORS_SERVICE" | "SANS_POSITION" | "POSITION";

/**
 * GET /api/gps/engins/{idEngin}/localisation — dernière position d'UN véhicule.
 * Boîtier null si NON_EQUIPE ; coordonnées, vitesse et horodatage renseignés seulement si POSITION.
 */
export interface LocalisationVehicule {
  idEngin: number;
  libelleVehicule: string;
  statutEngin: StatutEngin;
  etat: EtatLocalisationGps;
  idDispositifGps: number | null;
  numeroSerie: string | null;
  statutDispositif: StatutDispositifGps | null;
  latitude: number | null;
  longitude: number | null;
  vitesse: number | null;
  horodatage: string | null;
}
