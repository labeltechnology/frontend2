import type { CategorieEngin } from "@/types/engin";

/**
 * Page « Performance et utilisation » (2026-09-28) : miroir de
 * PerformanceParcDto (GET /api/performance?debut&fin&idTypeEngin).
 */

export type StatutKpi = "ATTEINT" | "PROCHE" | "NON_ATTEINT" | "SANS_OBJECTIF" | "NON_CALCULE";
export type SensKpi = "HAUSSE" | "BAISSE";
export type NiveauEcart = "FAVORABLE" | "VIGILANCE" | "DEFAVORABLE" | "SANS_REFERENCE";
export type ClassementUsage = "SOUS_UTILISE" | "NORMAL" | "NON_EVALUE";
export type UniteUsage = "km" | "h";

export interface CoutsPerformance {
  carburant: number;
  maintenance: number;
  locationEntrante: number;
  incidents: number;
  total: number;
}

/** Une ligne de la fiche « KPI du parc ». */
export interface KpiParc {
  code: string;
  libelle: string;
  definition: string;
  formule: string;
  /** « % », « véhicules », « km/mois », « Ar/km »… */
  unite: string;
  /** « Hebdomadaire », « Mensuelle », « Trimestrielle ». */
  frequence: string;
  sens: SensKpi;
  valeur: number | null;
  objectif: number | null;
  objectifParDefaut: number | null;
  statut: StatutKpi;
}

export interface PerformanceVehicule {
  idEngin: number;
  libelleVehicule: string;
  idTypeEngin: number | null;
  libelleType: string;
  categorie: CategorieEngin | null;
  equipeGps: boolean;
  joursParc: number;
  joursImmobilises: number;
  joursDisponibles: number;
  joursUtilises: number;
  tauxUtilisation: number | null;
  kilometres: number;
  heures: number;
  /** km (ou h) ramenés à 30 jours dans le parc. */
  usageMensuel: number | null;
  uniteUsage: UniteUsage;
  litres: number;
  couts: CoutsPerformance;
  /** Ar par km (ou par h). */
  coutParUnite: number | null;
  coutReference: number | null;
  ecartReferencePourcent: number | null;
  niveauEcart: NiveauEcart;
  classement: ClassementUsage;
  motifs: string[];
  /** Parmi les véhicules en trop de son type. */
  enTrop: boolean;
}

export interface SyntheseTypePerformance {
  idTypeEngin: number | null;
  libelle: string;
  categorie: CategorieEngin | null;
  uniteUsage: UniteUsage;
  nombreVehicules: number;
  tauxUtilisation: number | null;
  usage: number;
  usageMensuelMoyen: number | null;
  couts: CoutsPerformance;
  coutParUnite: number | null;
  coutReference: number | null;
  ecartReferencePourcent: number | null;
  niveauEcart: NiveauEcart;
  seuilTauxJours: number | null;
  seuilUsageMensuel: number | null;
  nombreSousUtilises: number;
  /** Plus grand nombre de véhicules du type utilisés le même jour. */
  picSimultane: number;
  vehiculesEnTrop: number;
}

export interface PerformanceParc {
  debut: string;
  fin: string;
  joursPeriode: number;
  idTypeEngin: number | null;
  indicateurs: KpiParc[];
  couts: CoutsPerformance;
  vehicules: PerformanceVehicule[];
  types: SyntheseTypePerformance[];
}
