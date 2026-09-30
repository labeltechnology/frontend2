import type { CategorieEngin, Engin } from "@/types/engin";

/**
 * Filtre de la liste des véhicules passé dans l'adresse (2026-09-30) :
 * `/engins?type=3` ou `/engins?categorie=ENGIN_CHANTIER`. Sert aux liens du
 * tableau de bord (« Statut du parc » par catégorie). Logique pure, testée.
 */
export interface FiltreUrlVehicules {
  idTypeEngin: number | null;
  categorie: CategorieEngin | null;
}

export const LIBELLES_CATEGORIE: Record<CategorieEngin, string> = {
  VEHICULE_ROUTIER: "Véhicules routiers",
  ENGIN_CHANTIER: "Engins de chantier",
};

const CATEGORIES = Object.keys(LIBELLES_CATEGORIE) as CategorieEngin[];

/** Lit `type` (entier positif) et `categorie` ; toute autre valeur est ignorée. */
export function lireFiltreUrl(params: URLSearchParams): FiltreUrlVehicules {
  const type = Number(params.get("type"));
  const categorie = params.get("categorie");
  return {
    idTypeEngin: Number.isInteger(type) && type > 0 ? type : null,
    categorie: CATEGORIES.includes(categorie as CategorieEngin) ? (categorie as CategorieEngin) : null,
  };
}

export function filtreUrlActif(f: FiltreUrlVehicules): boolean {
  return f.idTypeEngin !== null || f.categorie !== null;
}

export function appliquerFiltreUrl(engins: readonly Engin[], f: FiltreUrlVehicules): Engin[] {
  return engins.filter(
    (e) =>
      (f.idTypeEngin === null || e.typeEngin?.idTypeEngin === f.idTypeEngin) &&
      (f.categorie === null || e.typeEngin?.categorie === f.categorie),
  );
}

/** « Type : Pelle », « Engins de chantier » ; null sans filtre. */
export function libelleFiltreUrl(f: FiltreUrlVehicules, engins: readonly Engin[]): string | null {
  if (f.idTypeEngin !== null) {
    const type = engins.find((e) => e.typeEngin?.idTypeEngin === f.idTypeEngin)?.typeEngin;
    return `Type : ${type?.libelle ?? `n° ${f.idTypeEngin}`}`;
  }
  return f.categorie ? LIBELLES_CATEGORIE[f.categorie] : null;
}

/** Lien vers la liste filtrée. */
export function lienVehiculesFiltres(f: Partial<FiltreUrlVehicules>): string {
  if (f.idTypeEngin != null) return `/engins?type=${f.idTypeEngin}`;
  if (f.categorie) return `/engins?categorie=${f.categorie}`;
  return "/engins";
}
