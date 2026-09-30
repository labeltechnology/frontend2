import type { StatutChantier, ZoneChantier } from "@/types/chantier";

/**
 * Chantiers sur la carte GPS et trajet par période (2026-09-30).
 * GET /api/carte/chantiers et GET /api/gps/trajet.
 */

/** « ZONES » : zones du plan (à moins du rayon des points et lignes) ; « RAYON » : cercle autour du repère. */
export type SourcePerimetre = "ZONES" | "RAYON" | "AUCUNE";

export interface VehiculeChantierCarte {
  idEngin: number;
  libelleVehicule: string | null;
  dateDebutPrevue: string | null;
  dateFinPrevue: string | null;
  /** La période prévue du rattachement couvre aujourd'hui. */
  prevuAujourdhui: boolean;
  /** Dernière position dans le périmètre ; null sans position ou chantier non localisable. */
  surPlace: boolean | null;
  horodatagePosition: string | null;
}

export interface ChantierCarte {
  idChantier: number;
  nom: string;
  lieu: string | null;
  statut: StatutChantier;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  latitude: number | null;
  longitude: number | null;
  rayonPresenceMetres: number;
  sourcePerimetre: SourcePerimetre;
  zones: ZoneChantier[];
  vehicules: VehiculeChantierCarte[];
}

export interface PointTrajet {
  horodatage: string;
  latitude: number;
  longitude: number;
  vitesse: number | null;
}

export interface PassageChantier {
  idChantier: number;
  nomChantier: string;
  entree: string;
  /** Dernière position dans le périmètre. */
  sortie: string;
  dureeMinutes: number;
  positions: number;
  /** Encore sur le chantier à la fin de la période. */
  enCours: boolean;
  latitudeEntree: number;
  longitudeEntree: number;
  latitudeSortie: number;
  longitudeSortie: number;
}

export interface TrajetPeriode {
  idDispositifGps: number;
  numeroSerie: string;
  idEngin: number | null;
  libelleVehicule: string | null;
  debut: string;
  fin: string;
  nombrePositions: number;
  /** Tracé allégé (2 000 positions au plus) ; distance et passages restent calculés sur tout. */
  echantillonne: boolean;
  distanceKm: number;
  vitesseMaxKmh: number | null;
  positions: PointTrajet[];
  passages: PassageChantier[];
}
