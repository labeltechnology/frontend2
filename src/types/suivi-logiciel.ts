/** Suivi du logiciel (2026-09-29) — miroir des DTO serveur (adoption, qualitedonnees, security/connexion). */
export type CanalConnexion = "WEB" | "MOBILE";

export interface JournalConnexion {
  idJournalConnexion: number;
  dateConnexion: string;
  emailSaisi: string;
  idUtilisateur: number | null;
  nomUtilisateur: string | null;
  role: string | null;
  canal: CanalConnexion;
  succes: boolean;
  motif: string | null;
  adresseIp: string | null;
  navigateur: string | null;
}

export type ActiviteUtilisateur = "ACTIF" | "INACTIF" | "JAMAIS";

export interface Adoption {
  debutJournalConnexions: string | null;
  tauxAdoption: number | null;
  comptesActifs: number;
  utilisateursConnectes: number;
  connexions: number;
  saisies: number;
  partMobile: number | null;
  mois: { mois: string; comptesActifs: number; utilisateursConnectes: number; tauxAdoption: number | null; connexions: number; saisies: number }[];
  roles: { role: string; comptesActifs: number; connectes: number; tauxAdoption: number | null; connexions: number; saisies: number }[];
  utilisateurs: {
    idUtilisateur: number;
    nom: string;
    email: string;
    role: string | null;
    activite: ActiviteUtilisateur;
    derniereConnexion: string | null;
    connexions: number;
    saisies: number;
  }[];
}

export type CritereCompletude =
  | "KILOMETRAGE_RECENT"
  | "CONSOMMATION_REFERENCE"
  | "CAPACITE_RESERVOIR"
  | "DOCUMENTS_OBLIGATOIRES"
  | "COUTS_FIXES"
  | "DATE_ACQUISITION"
  | "QUALIFICATION"
  | "TELEPHONE";

export interface ElementIncomplet {
  id: number;
  libelle: string;
  precision: string | null;
  criteres: CritereCompletude[];
  manques: string[];
}

export interface QualiteDonnees {
  date: string;
  tauxGlobal: number | null;
  nombreVehicules: number;
  vehiculesComplets: number;
  nombreConducteurs: number;
  conducteursComplets: number;
  criteres: { critere: CritereCompletude; libelle: string; vehicule: boolean; controles: number; remplis: number; taux: number | null }[];
  vehicules: ElementIncomplet[];
  conducteurs: ElementIncomplet[];
}
