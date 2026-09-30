/** Renouvellement du parc (2026-09-29) — miroir des DTO serveur (package renouvellement). */
import type { ModeAcquisition } from "@/types/couts";

export type PrioriteRenouvellement = "URGENT" | "A_PREVOIR" | "PLANIFIE" | "AU_DELA";
export type Energie = "GASOIL" | "ESSENCE" | "ELECTRIQUE" | "HYBRIDE" | "AUTRE";

export interface PlanVehicule {
  idEngin: number;
  libelleVehicule: string;
  idTypeEngin: number | null;
  libelleType: string | null;
  uniteUsage: "km" | "h";
  ageAns: number | null;
  compteur: number;
  usageMensuel: number | null;
  modeAcquisition: ModeAcquisition | null;
  energie: Energie | null;
  pannes12Mois: number;
  coutParUnite: number | null;
  coutParUnitePrecedent: number | null;
  hausseCoutPourcent: number | null;
  valeurNette: number | null;
  prixRemplacement: number | null;
  anneeRenouvellement: number | null;
  priorite: PrioriteRenouvellement;
  motifs: string[];
}

export interface ParcType {
  idTypeEngin: number | null;
  libelle: string | null;
  nombre: number;
  ageMoyen: number | null;
  nombreAgeInconnu: number;
  nombreAchat: number;
  nombreLocationLongueDuree: number;
  nombreCreditBail: number;
  nombreModeInconnu: number;
  nombreElectriques: number;
  nombreHybrides: number;
}

export interface EnergieParc {
  nombreVehicules: number;
  parEnergie: Record<string, number>;
  partElectrifiee: number | null;
  coutKmElectrifie: number | null;
  coutKmThermique: number | null;
}

export interface AnneePlan {
  annee: number;
  nombre: number;
  montantBudget: number;
  nombreSansPrix: number;
}

export interface PlanRenouvellement {
  anneeCourante: number;
  ageRemplacementAns: number;
  kilometrageRemplacement: number;
  heuresRemplacement: number;
  hausseCoutPourcent: number;
  ageMoyen: number | null;
  nombreUrgents: number;
  nombreAPrevoir: number;
  annees: AnneePlan[];
  vehicules: PlanVehicule[];
  types: ParcType[];
  energie: EnergieParc;
}

export type ConclusionBesoin = "A_ACQUERIR" | "ADAPTE" | "EN_SURPLUS" | "SANS_ACTIVITE";

export interface BesoinType {
  idTypeEngin: number | null;
  libelle: string | null;
  uniteUsage: "km" | "h";
  nombreEnService: number;
  tauxDisponibilite: number | null;
  picSimultane: number;
  usageRecent: number;
  usageAncien: number;
  tendancePourcent: number | null;
  besoinChantier: number;
  besoinProjete: number;
  vehiculesNecessaires: number;
  ecart: number;
  conclusion: ConclusionBesoin;
}

export interface BesoinsFuturs {
  debutAncien: string;
  debutRecent: string;
  fin: string;
  nombreAAcquerir: number;
  nombreEnSurplus: number;
  types: BesoinType[];
}

export type MotifCession = "VENTE" | "REFORME" | "PERTE_TOTALE" | "AUTRE";

export interface FinDeVieVehicule {
  idEngin: number;
  libelleVehicule: string;
  libelleType: string | null;
  statut: "REFORME" | "VENDU" | string;
  cessionRenseignee: boolean;
  dateCession: string | null;
  motif: MotifCession | null;
  prixCession: number | null;
  acquereur: string | null;
  commentaire: string | null;
  prixAchat: number | null;
  valeurNette: number | null;
  plusOuMoinsValue: number | null;
}

export interface FinDeVie {
  nombreSortis: number;
  nombreACompleter: number;
  montantCessions: number;
  montantPlusValues: number;
  montantMoinsValues: number;
  vehicules: FinDeVieVehicule[];
}

export interface EnregistrerCessionRequest {
  dateCession: string;
  motif: MotifCession;
  prixCession: number | null;
  acquereur: string | null;
  commentaire: string | null;
}
