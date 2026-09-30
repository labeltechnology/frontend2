import type { Conducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";

export type StatutAffectation = "ACTIVE" | "TERMINEE" | "ANNULEE";

export interface Affectation {
  idAffectation: number;
  dateDebut: string;
  dateFin: string | null;
  motifAnnulation: string | null;
  statut: StatutAffectation;
  engin: Engin;
  conducteur: Conducteur;
}

export interface CreerAffectationRequest {
  idEngin: number;
  idConducteur: number;
}
