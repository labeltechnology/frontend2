/** Tableau de bord de direction (2026-09-30) — miroir des DTO de `backend/.../pilotage`. */

export type SensKpi = "HAUSSE" | "BAISSE";
export type EtatKpi = "ATTEINT" | "A_SURVEILLER" | "CRITIQUE" | "OBJECTIF_A_FIXER" | "SANS_DONNEE";
export type DirectionTendance = "HAUSSE" | "BAISSE" | "STABLE";

export interface TendanceKpi {
  variation: number | null;
  enPoints: boolean;
  direction: DirectionTendance;
  amelioration: boolean | null;
}

export interface KpiPilotage {
  code: string;
  libelle: string;
  definition: string;
  unite: string;
  sens: SensKpi;
  valeur: number | null;
  valeurPrecedente: number | null;
  objectif: number | null;
  seuilAlerte: number | null;
  objectifPartageAvecPerformance: boolean;
  etat: EtatKpi;
  tendance: TendanceKpi;
  precision: string | null;
  periode: string;
  lien: string;
}

export interface ReglageKpiRequest {
  objectif: number | null;
  seuilAlerte: number | null;
}

export type NiveauAlertePilotage = "CRITIQUE" | "AVERTISSEMENT";
export type CategorieAlertePilotage = "IMMOBILISATION" | "BUDGET" | "CHANTIER";

export interface AlertePilotage {
  cle: string;
  niveau: NiveauAlertePilotage;
  categorie: CategorieAlertePilotage;
  titre: string;
  details: string[];
  impactJour: number | null;
  montant: number | null;
  libelleMontant: string | null;
  action: string;
  lien: string;
}

export interface RepartitionFlotte {
  total: number;
  enService: number;
  surChantier: number;
  atelier: number;
  panne: number;
  horsService: number;
}

export interface TypeFlotte {
  idTypeEngin: number | null;
  libelle: string;
  categorie: string | null;
  repartition: RepartitionFlotte;
  tauxUtilisation: number | null;
  usageParJour: number | null;
  uniteUsage: string | null;
}

export interface Immobilisation {
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  statut: "EN_PANNE" | "EN_MAINTENANCE";
  motif: string;
  depuis: string | null;
  heures: number | null;
  atelier: string | null;
  etat: string;
  priseEnCharge: boolean;
  interventionPrevue: string | null;
  coutJour: number | null;
  coutCumule: number | null;
  coutEstime: number | null;
  idChantier: number | null;
  chantier: string | null;
  lien: string;
}

export interface FlottePilotage {
  total: RepartitionFlotte;
  types: TypeFlotte[];
  immobilisations: Immobilisation[];
  periodeUtilisation: string;
}

export type PosteBudget = "CARBURANT" | "MAINTENANCE" | "PNEUS" | "ASSURANCE_TAXES" | "DETENTION" | "AUTRES";
export type EtatBudget = "BUDGET_TENU" | "RISQUE_DEPASSEMENT" | "DEPASSE" | "SANS_BUDGET";

export interface LigneCoutMois {
  poste: PosteBudget | null;
  libelle: string;
  budget: number | null;
  reel: number;
  projection: number;
  ecartProjete: number | null;
  ecartPourcent: number | null;
  consommation: number | null;
  etat: EtatBudget;
}

export interface CoutsMois {
  mois: string;
  debut: string;
  fin: string;
  joursEcoules: number;
  joursMois: number;
  postes: LigneCoutMois[];
  total: LigneCoutMois;
  postesSansBudget: string[];
}

export interface LigneBudgetPoste {
  poste: PosteBudget;
  libelle: string;
  idBudgetPoste: number | null;
  montantAnnuel: number | null;
  partsMensuelles: number[];
  modifiable: boolean;
}

export interface BudgetsPostes {
  annee: number;
  postes: LigneBudgetPoste[];
}

export interface EnregistrerBudgetPosteRequest {
  annee: number;
  poste: PosteBudget;
  montantAnnuel: number;
  partsMensuelles: number[] | null;
}
