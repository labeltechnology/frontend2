import type { Engin } from "@/types/engin";

export type StatutContratLocation = "ACTIF" | "TERMINE";

/**
 * Contrat par lequel l'entreprise met un de ses véhicules à disposition d'une
 * société externe (l'engin est loué À une autre société — voir
 * ContratLocationExterne côté backend).
 */
export interface ContratLocationExterne {
  idContratLocationExterne: number;
  engin: Engin;
  nomSociete: string;
  personneContact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  referenceContrat: string | null;
  dateDebut: string;
  dateFinPrevue: string | null;
  dateFinReelle: string | null;
  conditions: string | null;
  statut: StatutContratLocation;
  /** Règle de facturation validée avec l'utilisateur : montant facturé = tarifJournalier × nombre de jours. */
  tarifJournalier: number | null;
}

export interface CreerContratLocationRequest {
  idEngin: number;
  nomSociete: string;
  personneContact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  referenceContrat?: string;
  dateDebut: string;
  dateFinPrevue?: string;
  conditions?: string;
  tarifJournalier?: number;
}

export type StatutFacture = "EMISE" | "PAYEE" | "ANNULEE";

/** {@code reference} est calculée côté backend (voir FactureLocationMapper), pas stockée en base. */
export interface FactureLocation {
  idFactureLocation: number;
  reference: string;
  contrat: ContratLocationExterne;
  dateDebutPeriode: string;
  dateFinPeriode: string;
  nombreJours: number;
  tarifJournalierApplique: number;
  /** Montant hors taxe (tarifJournalierApplique × nombreJours). */
  montant: number;
  /** Taux de TVA et montants dérivés, figés à l'émission (itération 14) — voir FactureLocation côté backend. */
  tauxTvaApplique: number;
  montantTva: number;
  montantTtc: number;
  statut: StatutFacture;
  dateEmission: string;
  datePaiement: string | null;
}

/** Création manuelle uniquement, pour une période choisie (choix confirmé avec l'utilisateur). */
export interface CreerFactureLocationRequest {
  idContrat: number;
  dateDebutPeriode: string;
  dateFinPeriode: string;
}
