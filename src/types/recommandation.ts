/** Recommandations par règles (2026-09-29) — miroir de RecommandationsDto. */
export type PrioriteRecommandation = "HAUTE" | "MOYENNE" | "BASSE";
export type DomaineRecommandation = "CONFORMITE" | "RENOUVELLEMENT" | "COUTS" | "UTILISATION" | "CARBURANT" | "CONDUITE";
export type CibleRecommandation = "VEHICULE" | "CONDUCTEUR" | "PARC";

export interface Recommandation {
  priorite: PrioriteRecommandation;
  domaine: DomaineRecommandation;
  cible: CibleRecommandation;
  idCible: number | null;
  libelleCible: string;
  precision: string | null;
  action: string;
  justification: string;
  lien: string;
}

export interface Recommandations {
  date: string;
  nombreHaute: number;
  nombreMoyenne: number;
  nombreBasse: number;
  recommandations: Recommandation[];
  sourcesIndisponibles: string[];
}
