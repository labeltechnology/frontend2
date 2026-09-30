import type { CoutsPerformance } from "@/types/performance";

/**
 * Coûts et rentabilité (2026-09-29) : miroir des DTO serveur de cout/ —
 * coûts fixes d'un véhicule, TCO, véhicules problématiques, budget carburant.
 */

export type ModeAcquisition = "ACHAT" | "LOCATION_LONGUE_DUREE" | "CREDIT_BAIL";

export interface CoutVehicule {
  idEngin: number;
  modeAcquisition: ModeAcquisition;
  prixAchat: number | null;
  dateDebutAmortissement: string | null;
  dureeAmortissementMois: number | null;
  valeurResiduelle: number | null;
  loyerMensuel: number | null;
  primeAssuranceAnnuelle: number | null;
  taxesAnnuelles: number | null;
  vignetteAnnuelle: number | null;
  autresChargesAnnuelles: number | null;
  /** Calculés par le serveur. */
  amortissementMensuel: number | null;
  valeurNetteComptable: number | null;
  chargesAnnuellesTotales: number | null;
}

export type EnregistrerCoutVehiculeRequest = Omit<
  CoutVehicule,
  "idEngin" | "amortissementMensuel" | "valeurNetteComptable" | "chargesAnnuellesTotales"
>;

export interface CoutsFixes {
  amortissement: number;
  loyers: number;
  assurance: number;
  taxesEtVignette: number;
  autres: number;
  total: number;
}

export interface TcoVehicule {
  idEngin: number;
  libelleVehicule: string;
  idTypeEngin: number | null;
  libelleType: string;
  uniteUsage: "km" | "h";
  joursParc: number;
  usage: number;
  coutsVariables: CoutsPerformance;
  dontPneus: number;
  coutsFixes: CoutsFixes;
  total: number;
  coutParUnite: number | null;
  coutParJour: number | null;
  partFixesPourcent: number | null;
  valeurNetteComptable: number | null;
  coutsFixesRenseignes: boolean;
}

export interface TcoType {
  idTypeEngin: number | null;
  libelle: string;
  uniteUsage: "km" | "h";
  nombreVehicules: number;
  coutsVariables: number;
  coutsFixes: number;
  total: number;
  coutParUnite: number | null;
  coutMoyenParVehicule: number | null;
}

export interface TcoParc {
  debut: string;
  fin: string;
  joursPeriode: number;
  idTypeEngin: number | null;
  total: number;
  coutsVariables: CoutsPerformance;
  dontPneus: number;
  coutsFixes: CoutsFixes;
  coutParKm: number | null;
  coutParHeure: number | null;
  nombreSansCoutsFixes: number;
  vehicules: TcoVehicule[];
  types: TcoType[];
}

export type NiveauProbleme = "NORMAL" | "A_SURVEILLER" | "A_REMPLACER";

export interface SeuilsProblemes {
  ecartSurveillancePourcent: number;
  ecartRemplacementPourcent: number;
  pannesSurveillance: number;
  pannesRemplacement: number;
  ageRemplacementAns: number;
  kilometrageRemplacement: number;
  heuresRemplacement: number;
}

export interface VehiculeProblematique {
  idEngin: number;
  libelleVehicule: string;
  idTypeEngin: number | null;
  libelleType: string;
  uniteUsage: "km" | "h";
  coutMaintenance: number;
  usage: number;
  coutMaintenanceParUnite: number | null;
  moyenneType: number | null;
  ecartPourcent: number | null;
  pannes: number;
  reparationsCorrectives: number;
  pannesRetenues: number;
  ageAns: number | null;
  compteur: number;
  niveau: NiveauProbleme;
  motifs: string[];
}

export interface VehiculesProblematiques {
  debut: string;
  fin: string;
  seuils: SeuilsProblemes;
  nombreASurveiller: number;
  nombreARemplacer: number;
  vehicules: VehiculeProblematique[];
}

export type CauseEcart = "USAGE" | "CONSOMMATION" | "PRIX" | "AUCUNE";

export interface LigneBudgetCarburant {
  idBudgetCarburant: number;
  idTypeEngin: number | null;
  libelle: string;
  uniteUsage: "km" | "h";
  usagePrevu: number;
  consommationPrevue: number;
  prixLitrePrevu: number;
  partsMensuelles: number[];
  montantAnnuel: number;
  budgetADate: number;
  reelADate: number;
  ecart: number;
  ecartPourcent: number | null;
  effetUsage: number;
  effetConsommation: number;
  effetPrix: number;
  causePrincipale: CauseEcart;
  libelleCause: string;
  projectionFinAnnee: number | null;
  usageReel: number;
  litresReels: number;
  consommationReelle: number | null;
  prixLitreReel: number | null;
}

export interface SuiviBudgetCarburant {
  annee: number;
  dateReference: string;
  montantAnnuel: number;
  budgetADate: number;
  reelADate: number;
  ecart: number;
  ecartPourcent: number | null;
  projectionFinAnnee: number | null;
  reelSansBudget: number;
  typesSansBudget: string[];
  lignes: LigneBudgetCarburant[];
  mois: { mois: number; budget: number; reel: number }[];
}

export interface EnregistrerBudgetCarburantRequest {
  annee: number;
  idTypeEngin: number | null;
  usagePrevu: number;
  consommationPrevue: number;
  prixLitrePrevu: number;
  /** 12 parts en % ; absent = parts égales. */
  partsMensuelles?: number[] | null;
}
