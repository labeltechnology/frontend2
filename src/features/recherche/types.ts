/** Recherche globale (2026-09-30) — miroir de `backend/.../recherche/ResultatRechercheDto`. */
export interface ElementRecherche {
  id: number;
  titre: string;
  detail: string | null;
  statut: string | null;
  lien: string;
}

export interface ResultatRecherche {
  terme: string;
  vehicules: ElementRecherche[];
  conducteurs: ElementRecherche[];
  chantiers: ElementRecherche[];
  missions: ElementRecherche[];
}
