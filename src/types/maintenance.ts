import type { Engin } from "@/types/engin";
import type { TravailMaintenanceResume } from "@/types/travail-maintenance";

export type StatutMaintenance = "PLANIFIEE" | "EN_COURS" | "TERMINEE";
export type TypeMaintenance = "PREVENTIVE" | "CORRECTIVE";

export interface MaintenancePiece {
  idPiece: number;
  nomPiece: string;
  quantiteUtilisee: number;
  prixUnitaireApplique: number;
}

export interface Maintenance {
  idMaintenance: number;
  engin: Engin;
  type: TypeMaintenance;
  statut: StatutMaintenance;
  description: string | null;
  /** Date prévue d'une maintenance planifiée (2026-09-28, V54) ; null si non renseignée. */
  datePrevue?: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  coutMainOeuvre: number | null;
  coutTotal: number | null;
  prochaineDateEntretien: string | null;
  referenceFacture: string | null;
  piecesUtilisees: MaintenancePiece[];
  /** Garage externe ayant réalisé la maintenance (null = atelier interne). */
  idGarageExterne: number | null;
  nomGarageExterne: string | null;
  /** Poste d'entretien périodique concerné (2026-09-24) — son échéance est recalculée à la clôture. */
  idPosteEntretien: number | null;
  libellePosteEntretien: string | null;
  /** Travaux réalisés (2026-09-25, V45) : changement de roues, plaquettes de frein... ; vide si aucun. */
  travaux: TravailMaintenanceResume[];
  /** Pièces facturées par le garage externe (2026-09-25, V46) ; vide pour l'atelier interne. */
  piecesExternes: LignePieceExterne[];
  /** Coût calculé à l'instant (pièces + main-d'œuvre) ; `coutTotal` n'est figé qu'à la clôture. */
  coutCalcule: number | null;
}

/** Pièce facturée par un garage externe : ligne libre, sans lien avec le stock interne (V46). */
export interface LignePieceExterne {
  idLignePieceExterne: number;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

/** PUT /api/maintenances/{id}/couts-garage : la liste complète remplace la précédente. */
export interface DefinirCoutsGarageRequest {
  coutMainOeuvre: number;
  piecesExternes: { designation: string; quantite: number; prixUnitaire: number }[];
}

export interface CreerMaintenanceRequest {
  idEngin: number;
  type: TypeMaintenance;
  description?: string;
  /** Optionnel — garage externe (omis = atelier interne). */
  idGarageExterne?: number;
  /** Optionnel — poste d'entretien périodique (vidange moteur, pneumatiques...). */
  idPosteEntretien?: number;
  /** Optionnel (2026-09-25) — travaux choisis dans le référentiel « Travaux de maintenance ». */
  idsTravaux?: number[];
  /** Optionnel (2026-09-28) — date prévue (maintenance planifiée), format « AAAA-MM-JJTHH:mm », pas dans le passé. */
  datePrevue?: string;
}

export interface Piece {
  idPiece: number;
  reference: string;
  nom: string;
  prixUnitaire: number;
  quantiteStock: number;
  seuilAlerteStock: number;
  stockBas: boolean;
  /** Fournisseur de la pièce (null = non renseigné). */
  idFournisseur: number | null;
  nomFournisseur: string | null;
}

export interface CreerPieceRequest {
  reference: string;
  nom: string;
  prixUnitaire: number;
  quantiteStock: number;
  seuilAlerteStock: number;
  /** Optionnel — fournisseur de la pièce. */
  idFournisseur?: number;
}

export interface UtiliserPieceRequest {
  idPiece: number;
  quantite: number;
}

export type StatutFactureGarage = "EMISE" | "PAYEE" | "ANNULEE";

/**
 * Facture d'une intervention réalisée par un garage externe (règles
 * validées avec l'utilisateur) : une facture = une seule intervention de
 * maintenance, montant = coutTotal de cette intervention. {@code reference}
 * est calculée côté backend (voir FactureGarageMapper), pas stockée en base.
 */
export interface FactureGarage {
  idFactureGarage: number;
  reference: string;
  maintenance: Maintenance;
  montant: number;
  statut: StatutFactureGarage;
  dateEmission: string;
  datePaiement: string | null;
}

/** Création manuelle uniquement, pour une intervention déjà terminée (choix confirmé avec l'utilisateur). */
export interface CreerFactureGarageRequest {
  idMaintenance: number;
}

/**
 * Proforma (devis) du garage externe justifiant le coût d'une maintenance —
 * demande explicite de l'utilisateur (« il faut uplouader aussi le facture
 * proformat du garage externe avant de valider la maintenance externe »).
 * Un seul proforma par maintenance, remplaçable (pas d'historique, à la
 * différence d'{@code EnginPhoto}).
 */
export interface MaintenanceProforma {
  idMaintenanceProforma: number;
  nomFichierOriginal: string | null;
  typeContenu: string | null;
  tailleOctets: number | null;
  url: string;
}
