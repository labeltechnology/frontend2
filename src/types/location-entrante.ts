import type { Engin } from "@/types/engin";

export type StatutContratLocationEntrante = "ACTIF" | "TERMINE";

/**
 * Contrat par lequel l'entreprise loue un engin/véhicule CHEZ un
 * prestataire externe, pour son propre usage — quand son parc n'a pas
 * d'engin disponible du type requis. Sens strictement inverse de
 * ContratLocationExterne (voir types/location.ts), où c'est l'entreprise
 * qui loue SES engins à une société externe — module volontairement séparé
 * (« Locations entrantes » dans le menu) pour éviter toute confusion.
 *
 * L'engin loué est un Engin normal et complet (créé au préalable via
 * l'écran Véhicules, choix confirmé avec l'utilisateur) : assignable à une
 * mission, suivi GPS, maintenance, etc. pendant toute la durée de la
 * location.
 */
export interface ContratLocationEntrante {
  idContratLocationEntrante: number;
  engin: Engin;
  /** Référence la fiche PrestataireLocation (page « Prestataires de location ») — plus de saisie libre. */
  idPrestataire: number;
  nomPrestataire: string;
  personneContact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  referenceContrat: string | null;
  dateDebut: string;
  dateFinPrevue: string | null;
  dateFinReelle: string | null;
  conditions: string | null;
  statut: StatutContratLocationEntrante;
  /** Règle de facturation : montant dû au prestataire = tarifJournalier × nombre de jours. */
  tarifJournalier: number | null;
}

export interface CreerContratLocationEntranteRequest {
  idEngin: number;
  idPrestataire: number;
  referenceContrat?: string;
  dateDebut: string;
  dateFinPrevue?: string;
  conditions?: string;
  tarifJournalier?: number;
}

export type StatutFactureLocationEntrante = "EMISE" | "PAYEE" | "ANNULEE";

/**
 * Facture REÇUE du prestataire (ce que l'entreprise lui doit/a payé) —
 * délibérément sans TVA ni aperçu PDF, à la différence de FactureLocation :
 * il ne s'agit pas d'un document émis par l'entreprise, voir
 * FactureLocationEntrante côté backend. {@code reference} est calculée côté
 * backend, pas stockée en base.
 */
export interface FactureLocationEntrante {
  idFactureLocationEntrante: number;
  reference: string;
  contrat: ContratLocationEntrante;
  dateDebutPeriode: string;
  dateFinPeriode: string;
  nombreJours: number;
  tarifJournalierApplique: number;
  montant: number;
  statut: StatutFactureLocationEntrante;
  dateEmission: string;
  datePaiement: string | null;
}

/** Enregistrement manuel uniquement, pour une période choisie. */
export interface CreerFactureLocationEntranteRequest {
  idContrat: number;
  dateDebutPeriode: string;
  dateFinPeriode: string;
}
