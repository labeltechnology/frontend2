import type { PorteeCategorie } from "@/types/equipement-bord";
import type { TypeMaintenance } from "@/types/maintenance";

/**
 * Travaux de maintenance (V45, 2026-09-25) — référentiel modifiable depuis
 * « Listes de la fiche », proposé dans la boîte « Faire la maintenance » du
 * rapport véhicule. Calqué sur `maintenance.travail.dto.TravailMaintenanceDto`.
 */
export interface TravailMaintenance {
  idTravailMaintenance: number;
  libelle: string;
  /** Type de maintenance proposé par défaut quand ce travail est choisi. */
  typeMaintenance: TypeMaintenance;
  portee: PorteeCategorie;
  ordre: number;
  actif: boolean;
}

/** Travail tel qu'affiché avec une maintenance (Maintenance.travaux). */
export interface TravailMaintenanceResume {
  idTravailMaintenance: number;
  libelle: string;
}

export interface CreerTravailMaintenanceRequest {
  libelle: string;
  typeMaintenance: TypeMaintenance;
  portee: PorteeCategorie;
  ordre: number;
}

export type ModifierTravailMaintenanceRequest = CreerTravailMaintenanceRequest;
