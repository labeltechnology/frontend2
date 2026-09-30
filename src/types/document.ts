import type { Conducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";

/**
 * CONFORMITE_FISCALE, LICENCE_TRANSPORT et CARTE_CARBURANT ajoutés le
 * 2026-09-24 : lignes du « Dossier complet du véhicule » de la fiche de suivi
 * de l'utilisateur. Libellés affichés : voir features/documents/libelles.ts.
 */
export type TypeDocument =
  | "CARTE_GRISE"
  | "ASSURANCE"
  | "VISITE_TECHNIQUE"
  | "PERMIS_CONDUIRE"
  | "AUTRE"
  | "CONFORMITE_FISCALE"
  | "LICENCE_TRANSPORT"
  | "CARTE_CARBURANT";

export interface Document {
  idDocument: number;
  type: TypeDocument;
  numeroReference: string | null;
  dateDebut: string | null;
  dateExpiration: string | null;
  cheminFichier: string | null;
  version: number;
  actif: boolean;
  engin: Engin | null;
  conducteur: Conducteur | null;
  idDocumentPrecedent: number | null;
}

export interface CreerDocumentRequest {
  type: TypeDocument;
  idEngin?: number;
  idConducteur?: number;
  numeroReference?: string;
  dateDebut?: string;
  dateExpiration?: string;
  cheminFichier?: string;
}

export interface RemplacerDocumentRequest {
  numeroReference?: string;
  dateDebut?: string;
  dateExpiration?: string;
  cheminFichier?: string;
}
