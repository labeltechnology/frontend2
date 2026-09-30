/**
 * Recadrage carré d'une photo de profil (2026-09-29), fonctions pures.
 * Le cadre est exprimé en pixels de l'image source ; l'écran le déplace
 * (glisser, flèches) et le zoome (curseur, + / -), puis exporte le carré en
 * JPEG de 512 px au plus. Le serveur réencode de toute façon (métadonnées
 * supprimées) : ce recadrage sert au confort et à alléger l'envoi.
 */

export const TAILLE_EXPORT = 512;
export const COTE_MIN = 64;
export const ZOOM_MAX = 4;
/** Taille de l'image CHOISIE (avant recadrage) : elle est réduite avant l'envoi. */
export const OCTETS_MAX_SOURCE = 20 * 1024 * 1024;
export const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface Cadre {
  x: number;
  y: number;
  cote: number;
}

/** Motif du refus du fichier choisi, null s'il convient. */
export function erreurFichierPhoto(fichier: { type: string; size: number } | null): string | null {
  if (!fichier) return "Aucun fichier choisi";
  if (!(TYPES_ACCEPTES as readonly string[]).includes(fichier.type)) return "Choisissez une photo JPEG, PNG ou WebP";
  if (fichier.size > OCTETS_MAX_SOURCE) return "Photo trop volumineuse (20 Mo maximum)";
  return null;
}

/** Motif du refus des dimensions, null si elles conviennent. */
export function erreurDimensions(largeur: number, hauteur: number): string | null {
  return Math.min(largeur, hauteur) < COTE_MIN ? `Photo trop petite (${COTE_MIN} px minimum de côté)` : null;
}

export function zoomBorne(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(ZOOM_MAX, Math.max(1, zoom));
}

/** Garde le cadre entièrement dans l'image. */
export function borner(cadre: Cadre, largeur: number, hauteur: number): Cadre {
  const cote = Math.min(cadre.cote, largeur, hauteur);
  return {
    cote,
    x: Math.min(Math.max(0, cadre.x), largeur - cote),
    y: Math.min(Math.max(0, cadre.y), hauteur - cote),
  };
}

/** Carré centré ; zoom 1 = le plus grand carré possible. */
export function cadreCentre(largeur: number, hauteur: number, zoom = 1): Cadre {
  const cote = Math.min(largeur, hauteur) / zoomBorne(zoom);
  return { cote, x: (largeur - cote) / 2, y: (hauteur - cote) / 2 };
}

/** Nouveau zoom en gardant le même centre. */
export function zoomer(cadre: Cadre, zoom: number, largeur: number, hauteur: number): Cadre {
  const cote = Math.min(largeur, hauteur) / zoomBorne(zoom);
  const cx = cadre.x + cadre.cote / 2;
  const cy = cadre.y + cadre.cote / 2;
  return borner({ cote, x: cx - cote / 2, y: cy - cote / 2 }, largeur, hauteur);
}

/** Déplace le cadre de (dx, dy) pixels de l'image source. */
export function deplacer(cadre: Cadre, dx: number, dy: number, largeur: number, hauteur: number): Cadre {
  return borner({ ...cadre, x: cadre.x + dx, y: cadre.y + dy }, largeur, hauteur);
}

/**
 * Glisser l'image de (dxEcran, dyEcran) pixels dans une zone d'aperçu de
 * côté {@code taillePreview} : l'image suit le doigt, donc le cadre part
 * dans l'autre sens, à l'échelle de l'image source.
 */
export function glisser(cadre: Cadre, dxEcran: number, dyEcran: number, taillePreview: number, largeur: number, hauteur: number): Cadre {
  const echelle = cadre.cote / taillePreview;
  return deplacer(cadre, -dxEcran * echelle, -dyEcran * echelle, largeur, hauteur);
}

/** Côté de l'image exportée : 512 px au plus, jamais plus que la zone choisie. */
export function tailleExport(cadre: Cadre): number {
  return Math.max(1, Math.min(TAILLE_EXPORT, Math.round(cadre.cote)));
}
