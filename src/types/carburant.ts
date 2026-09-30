import type { Conducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";

/** Plein complet, appoint ou bidon (2026-09-28) ; seul un plein complet ferme un tronçon de consommation. */
export type TypeApprovisionnement = "PLEIN_COMPLET" | "APPOINT" | "BIDON";

export interface Carburant {
  idCarburant: number;
  engin: Engin;
  conducteur: Conducteur | null;
  idDocument: number | null;
  dateHeure: string;
  kilometrageAuPlein: number;
  quantiteLitres: number;
  prixUnitaire: number;
  montantTotal: number;
  station: string | null;
  /** Absent sur une ancienne réponse = plein complet. */
  typeApprovisionnement?: TypeApprovisionnement | null;
  /** Compteur horaire relevé au plein (engin de chantier, facultatif — 2026-09-28). */
  compteurHeures?: number | null;
}

export interface CreerCarburantRequest {
  idEngin: number;
  idConducteur?: number;
  idDocument?: number;
  dateHeure: string;
  kilometrageAuPlein: number;
  quantiteLitres: number;
  prixUnitaire: number;
  station?: string;
  /** Absent = plein complet. */
  typeApprovisionnement?: TypeApprovisionnement;
  /** Compteur horaire (engin de chantier), facultatif. */
  compteurHeures?: number;
}

export interface ConsommationMoyenne {
  idEngin: number;
  litresAux100Km: number;
  nombrePleinsConsideres: number;
}
