/** Prévisions (2026-09-29) — miroir de PrevisionsDto. Montants en Ariary. */
export type NatureMoisPrevision = "REEL" | "EN_COURS" | "PROJECTION";

export interface MoisPrevision {
  /** « 2026-09 ». */
  mois: string;
  nature: NatureMoisPrevision;
  carburant: number | null;
  maintenance: number | null;
  autres: number | null;
  total: number | null;
  kilometres: number | null;
  heures: number | null;
  moyenneMobileTotal: number | null;
  moyenneMobileKilometres: number | null;
  projectionTotal: number | null;
  projectionCarburant: number | null;
  projectionKilometres: number | null;
  projectionHeures: number | null;
  budgetCarburant: number | null;
}

export interface Previsions {
  idTypeEngin: number | null;
  moisCourant: string;
  nombreMoisTendance: number;
  projectionPossible: boolean;
  tendanceTotalPourcent: number | null;
  tendanceKilometresPourcent: number | null;
  projectionTotal12Mois: number | null;
  projectionCarburant12Mois: number | null;
  projectionKilometres12Mois: number | null;
  projectionHeures12Mois: number | null;
  finAnneeReel: number;
  finAnneeProjection: number | null;
  budgetCarburantAnnee: number | null;
  finAnneeProjectionCarburant: number | null;
  mois: MoisPrevision[];
}
