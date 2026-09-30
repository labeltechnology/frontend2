export type TypeZone = "AUTORISEE" | "INTERDITE";
export type ModeDefinitionZone = "CERCLE" | "POLYGONE";

export interface ZoneGeographique {
  idZoneGeographique: number;
  nom: string;
  type: TypeZone;
  modeDefinition: ModeDefinitionZone;
  centreLatitude: number | null;
  centreLongitude: number | null;
  rayonMetres: number | null;
  polygoneGeoJson: string | null;
  actif: boolean;
}

export interface CreerZoneGeographiqueRequest {
  nom: string;
  type: TypeZone;
  modeDefinition: ModeDefinitionZone;
  centreLatitude?: number;
  centreLongitude?: number;
  rayonMetres?: number;
  polygoneGeoJson?: string;
}
