/**
 * Favoris et pages récentes (2026-09-30). Logique pure, testée ; le stockage
 * (par utilisateur, dans le navigateur) est dans useFavoris.ts.
 */
export const MAX_FAVORIS = 12;
export const MAX_RECENTS = 6;

export interface PageRecente {
  chemin: string;
  libelle: string;
}

export function basculerFavori(favoris: readonly string[], chemin: string): string[] {
  if (favoris.includes(chemin)) return favoris.filter((c) => c !== chemin);
  return [...favoris, chemin].slice(-MAX_FAVORIS);
}

/** La plus récente en tête, sans doublon de chemin (le libellé le plus récent gagne). */
export function ajouterRecent(recents: readonly PageRecente[], page: PageRecente): PageRecente[] {
  return [page, ...recents.filter((r) => r.chemin !== page.chemin)].slice(0, MAX_RECENTS);
}

export function estListeChemins(v: unknown): v is string[] {
  return Array.isArray(v) && v.length <= MAX_FAVORIS * 2 && v.every((c) => typeof c === "string" && c.startsWith("/") && c.length < 200);
}

export function estListeRecents(v: unknown): v is PageRecente[] {
  return (
    Array.isArray(v) &&
    v.length <= MAX_RECENTS * 2 &&
    v.every(
      (r) =>
        r && typeof r === "object" && typeof (r as PageRecente).chemin === "string" && (r as PageRecente).chemin.startsWith("/") &&
        typeof (r as PageRecente).libelle === "string" && (r as PageRecente).libelle.length < 200,
    )
  );
}
