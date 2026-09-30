/** Score de conduite mensuel (2026-09-29) : miroir de ScoresConduiteDto (GET /api/conduite/scores?mois=AAAA-MM). */

export type NiveauConduite = "BON" | "A_SURVEILLER" | "A_FORMER" | "NON_NOTE";

export interface ScoreConducteur {
  idConducteur: number;
  nom: string;
  matricule: string | null;
  kilometres: number;
  missions: number;
  survitesses: number;
  accelerations: number;
  freinages: number;
  virages: number;
  points: number;
  pointsPour100Km: number | null;
  score: number | null;
  niveau: NiveauConduite;
}

export interface ScoresConduite {
  mois: string;
  debut: string;
  fin: string;
  scoreMoyen: number | null;
  nombreBons: number;
  nombreASurveiller: number;
  nombreAFormer: number;
  evenementsNonAttribues: number;
  alarmesTraccarRecues: boolean;
  conducteurs: ScoreConducteur[];
}
