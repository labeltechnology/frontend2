/** Import Excel / CSV (2026-09-29) — miroir de ResultatImportDto. */
export type TypeImport = "VEHICULES" | "CONDUCTEURS" | "PLEINS";
export type StatutLigneImport = "OK" | "AVERTISSEMENT" | "ERREUR";

export interface LigneImport {
  numero: number;
  statut: StatutLigneImport;
  libelle: string | null;
  messages: string[];
}

export interface ResultatImport {
  type: TypeImport;
  fichier: string;
  enregistre: boolean;
  nombreLignes: number;
  nombreOk: number;
  nombreAvertissements: number;
  nombreErreurs: number;
  colonnesManquantes: string[];
  colonnesIgnorees: string[];
  lignes: LigneImport[];
}
