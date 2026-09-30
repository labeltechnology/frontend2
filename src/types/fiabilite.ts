/**
 * Maintenance et fiabilité, conformité, sinistres (2026-09-29) — miroir des
 * DTO serveur (packages fiabilite, conformite, sinistre).
 */
import type { TypeDocument } from "@/types/document";
import type { TypeIncident } from "@/types/incident";

// ---------------------------------------------------------------- Fiabilité

export interface FiabiliteVehicule {
  idEngin: number;
  libelleVehicule: string;
  idTypeEngin: number | null;
  libelleType: string | null;
  uniteUsage: "km" | "h";
  joursParc: number;
  joursImmobilises: number;
  tauxDisponibilite: number | null;
  coutImmobilisation: number | null;
  pannes: number;
  mtbfJours: number | null;
  mtbfUsage: number | null;
  dernierePanne: string | null;
}

export interface FiabiliteType {
  idTypeEngin: number | null;
  libelle: string | null;
  uniteUsage: "km" | "h";
  nombreVehicules: number;
  coutImmobilisationJour: number | null;
  tauxDisponibilite: number | null;
  joursImmobilises: number;
  coutImmobilisation: number | null;
  pannes: number;
  mtbfJours: number | null;
  mtbfUsage: number | null;
}

export interface MttrReparateur {
  idGarage: number | null;
  libelle: string;
  interne: boolean;
  nombre: number;
  heuresMoyennes: number;
  heuresMax: number;
}

export interface ReserveControle {
  idMaintenance: number;
  idEngin: number;
  libelleVehicule: string;
  controlePar: string;
  dateControle: string;
  reserve: string;
}

export type SituationRetard = "FAITE_EN_RETARD" | "NON_FAITE";

export interface RetardEcheance {
  idEngin: number;
  libelleVehicule: string;
  libellePoste: string;
  situation: SituationRetard;
  dateEcheance: string | null;
  compteurEcheance: number | null;
  dateIntervention: string | null;
  compteurIntervention: number | null;
  joursRetard: number | null;
  depassementCompteur: number | null;
  unite: "km" | "h";
}

export interface FiabiliteParc {
  debut: string;
  fin: string;
  joursPeriode: number;
  idTypeEngin: number | null;
  tauxDisponibilite: number | null;
  joursImmobilises: number;
  coutImmobilisation: number | null;
  nombreSansCoutImmobilisation: number;
  pannes: number;
  mtbfJours: number | null;
  types: FiabiliteType[];
  vehicules: FiabiliteVehicule[];
  mttr: { nombre: number; heuresMoyennes: number | null; reparateurs: MttrReparateur[] };
  controles: {
    nombreTerminees: number;
    nombreControlees: number;
    nombreAvecReserve: number;
    tauxControle: number | null;
    reserves: ReserveControle[];
  };
  echeances: {
    tauxATemps: number | null;
    nombreFaites: number;
    nombreFaitesATemps: number;
    nombreFaitesEnRetard: number;
    nombreNonFaitesEnRetard: number;
    retards: RetardEcheance[];
  };
}

export interface ReglageType {
  idTypeEngin: number;
  libelle: string;
  categorie: "VEHICULE_ROUTIER" | "ENGIN_CHANTIER";
  actif: boolean;
  coutImmobilisationJour: number | null;
  documentsObligatoires: TypeDocument[];
  documentsParDefaut: boolean;
}

export interface EnregistrerReglageTypeRequest {
  coutImmobilisationJour: number | null;
  documentsObligatoires: TypeDocument[];
}

// --------------------------------------------------------------- Conformité

export type EtatDocument = "VALIDE" | "BIENTOT_EXPIRE" | "EXPIRE" | "MANQUANT";

export interface VehiculeConformite {
  idEngin: number;
  libelleVehicule: string;
  idTypeEngin: number | null;
  libelleType: string | null;
  conforme: boolean;
  aSurveiller: boolean;
  documents: { type: TypeDocument; libelle: string; etat: EtatDocument; dateExpiration: string | null }[];
  motifs: string[];
}

export interface ConducteurConformite {
  idConducteur: number;
  nom: string;
  categorie: "VEHICULE_ROUTIER" | "ENGIN_CHANTIER";
  statut: string;
  qualification: string;
  dateExpiration: string | null;
  conforme: boolean;
  aSurveiller: boolean;
  motifs: string[];
  depassementsFatigue: number;
}

export type NatureDepassement = "CONDUITE_CONTINUE" | "CONDUITE_JOURNALIERE";

export interface DepassementFatigue {
  idDepassementFatigue: number;
  nature: NatureDepassement;
  idConducteur: number | null;
  nomConducteur: string | null;
  idEngin: number | null;
  libelleVehicule: string | null;
  jour: string;
  debut: string;
  fin: string;
  dureeMinutes: number;
  seuilMinutes: number;
}

export interface ParametresFatigue {
  actif: boolean;
  conduiteContinueMaxMinutes: number;
  pauseMinimaleMinutes: number;
  conduiteJournaliereMaxMinutes: number;
}

export interface Conformite {
  date: string;
  tauxVehicules: number | null;
  nombreVehicules: number;
  nombreVehiculesConformes: number;
  nombreVehiculesASurveiller: number;
  tauxConducteurs: number | null;
  nombreConducteurs: number;
  nombreConducteursConformes: number;
  nombreConducteursASurveiller: number;
  vehicules: VehiculeConformite[];
  conducteurs: ConducteurConformite[];
  seuilsFatigue: ParametresFatigue;
  depassementsFatigue: DepassementFatigue[];
}

// ----------------------------------------------------------------- Sinistres

export type ResponsabiliteSinistre = "A_DETERMINER" | "NON_RESPONSABLE" | "PARTAGEE" | "RESPONSABLE";
export type StatutDossierSinistre = "OUVERT" | "CLOS";

export interface Sinistre {
  idIncident: number;
  typeIncident: TypeIncident;
  dateSurvenue: string;
  idEngin: number | null;
  libelleVehicule: string | null;
  idConducteur: number | null;
  nomConducteur: string | null;
  assureur: string | null;
  numeroDossier: string | null;
  dateDeclaration: string | null;
  responsabilite: ResponsabiliteSinistre;
  montantDommagesSaisi: number | null;
  montantDommages: number;
  franchise: number | null;
  indemnisationRecue: number | null;
  dateIndemnisation: string | null;
  statutDossier: StatutDossierSinistre;
  commentaire: string | null;
  resteACharge: number;
}

export interface EnregistrerSinistreRequest {
  assureur: string | null;
  numeroDossier: string | null;
  dateDeclaration: string | null;
  responsabilite: ResponsabiliteSinistre;
  montantDommages: number | null;
  franchise: number | null;
  indemnisationRecue: number | null;
  dateIndemnisation: string | null;
  statutDossier: StatutDossierSinistre;
  commentaire: string | null;
}

export interface GroupeSinistres {
  id: number | null;
  libelle: string;
  nombre: number;
  nombreResponsable: number;
  montantDommages: number;
  montantResteACharge: number;
}

export interface Sinistralite {
  debut: string;
  fin: string;
  nombreSinistres: number;
  nombreDossiersOuverts: number;
  nombreAccidentsSansDossier: number;
  parResponsabilite: Record<ResponsabiliteSinistre, number>;
  montantDommages: number;
  montantFranchises: number;
  montantIndemnisations: number;
  montantResteACharge: number;
  tauxIndemnisation: number | null;
  sinistres: Sinistre[];
  parVehicule: GroupeSinistres[];
  parConducteur: GroupeSinistres[];
}
