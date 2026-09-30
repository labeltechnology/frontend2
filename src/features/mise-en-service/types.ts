/** Assistant de mise en service (2026-09-30) — miroir de `backend/.../miseenservice/MiseEnServiceDto`. */
export interface PointMiseEnService {
  libelle: string;
  fait: boolean;
  detail: string | null;
  lien: string;
}

export interface EtapeMiseEnService {
  numero: number;
  titre: string;
  qui: string;
  faits: number;
  total: number;
  points: PointMiseEnService[];
}

export interface MiseEnService {
  etapes: EtapeMiseEnService[];
  faits: number;
  total: number;
  pourcentage: number;
}
