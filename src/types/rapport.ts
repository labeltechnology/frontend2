export type TypeRapport =
  | "MISSIONS"
  | "MAINTENANCE"
  | "CARBURANT"
  | "INCIDENTS"
  | "PARC"
  | "VEHICULE"
  | "CONDUCTEUR"
  | "DOCUMENTS_A_EXPIRER"
  | "CHANTIER"
  | "RENTABILITE"
  | "TRESORERIE"
  | "INCIDENTS_RECAPITULATIF"
  | "UTILISATION_PARC"
  | "SYNTHESE_GENERALE"
  | "PERFORMANCE_UTILISATION"
  | "COUTS_RENTABILITE"
  // 2026-09-29 : maintenance et fiabilité, sinistres, renouvellement
  | "FIABILITE_CONFORMITE"
  | "SINISTRALITE"
  | "RENOUVELLEMENT";

export interface Rapport {
  idRapport: number;
  type: TypeRapport;
  dateDebutPeriode: string | null;
  dateFinPeriode: string | null;
  idEngin: number | null;
  idConducteur: number | null;
  idChantier: number | null;
  contenuJson: string;
  auteur: number | null;
  dateGeneration: string;
  /** « Véhicule : … », « Conducteur : … », « Chantier : … » ; null = tout le parc (2026-09-28). */
  libelleCible: string | null;
}

export interface GenererRapportRequest {
  type: TypeRapport;
  dateDebutPeriode?: string;
  dateFinPeriode?: string;
  idEngin?: number;
  idConducteur?: number;
  idChantier?: number;
}

/** Couleur de lecture d'un chiffre (2026-09-28) : neutre, bon, à surveiller, critique. */
export type TonIndicateur = "NEUTRE" | "POSITIF" | "ATTENTION" | "CRITIQUE";

/**
 * GET /api/rapports/{id}/presentation — rapport mis en forme, identique au
 * contenu du PDF et de l'Excel (voir ConstructeurPresentationRapport côté serveur).
 */
export interface PresentationRapport {
  idRapport: number;
  type: TypeRapport;
  titre: string;
  description: string;
  /** « 28/09/2026 à 14:05 » */
  dateGeneration: string | null;
  infos: { libelle: string; valeur: string }[];
  sections: SectionRapport[];
}

export interface SectionRapport {
  titre: string;
  indicateurs: { cle: string; libelle: string; valeur: string; ton: TonIndicateur }[];
  repartitions: RepartitionRapport[];
  listes: { titre: string; elements: string[] }[];
}

export interface RepartitionRapport {
  titre: string;
  total: number;
  elements: { libelle: string; valeur: number; valeurFormatee: string; part: number; ton: TonIndicateur }[];
}
