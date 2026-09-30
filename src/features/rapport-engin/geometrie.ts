/**
 * Géométrie des connecteurs pointillés du schéma véhicule (rapport, 2026-09-24).
 * Pur calcul, sans DOM : les rectangles sont mesurés par SchemaVehicule.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

export function centre(r: Rect): Point {
  return { x: r.x + r.largeur / 2, y: r.y + r.hauteur / 2 };
}

/**
 * Point où le segment [interieur → exterieur] sort du rectangle `r`, en
 * supposant `interieur` dans `r` (en pratique : son centre). Renvoie
 * `interieur` si le segment est nul.
 */
export function pointSortie(interieur: Point, exterieur: Point, r: Rect): Point {
  const dx = exterieur.x - interieur.x;
  const dy = exterieur.y - interieur.y;
  if (dx === 0 && dy === 0) return interieur;
  // Plus petit t > 0 où le segment touche un bord vertical ou horizontal.
  const tx = dx > 0 ? (r.x + r.largeur - interieur.x) / dx : dx < 0 ? (r.x - interieur.x) / dx : Infinity;
  const ty = dy > 0 ? (r.y + r.hauteur - interieur.y) / dy : dy < 0 ? (r.y - interieur.y) / dy : Infinity;
  const t = Math.min(tx, ty, 1);
  return { x: interieur.x + dx * t, y: interieur.y + dy * t };
}

/**
 * Connecteur entre la photo et un bloc : du bord de la photo au bord du
 * bloc, sur la droite qui relie leurs centres. `null` si les rectangles se
 * chevauchent (disposition empilée sur petit écran).
 */
export function connecteur(photo: Rect, bloc: Rect): { de: Point; vers: Point } | null {
  const chevauche =
    photo.x < bloc.x + bloc.largeur &&
    bloc.x < photo.x + photo.largeur &&
    photo.y < bloc.y + bloc.hauteur &&
    bloc.y < photo.y + photo.hauteur;
  if (chevauche) return null;
  const cp = centre(photo);
  const cb = centre(bloc);
  return { de: pointSortie(cp, cb, photo), vers: pointSortie(cb, cp, bloc) };
}
