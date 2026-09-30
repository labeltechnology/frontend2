/**
 * Règles des listes (2026-09-30, ergonomie) : tri, pagination, compteur,
 * filtre rapide. Logique pure, testée ; DataTable ne fait que l'afficher.
 */
export type SensTri = "asc" | "desc";
export type ValeurTri = string | number | boolean | null | undefined;

export interface TriListe {
  cle: string;
  sens: SensTri;
}

export interface EtatListe {
  tri: TriListe | null;
  page: number;
  taillePage: number;
  /** Valeur du filtre rapide choisie ; null = tous. */
  filtre: string | null;
}

export const TAILLES_PAGE = [10, 25, 50, 100] as const;
export const TAILLE_PAGE_DEFAUT = 25;

export const ETAT_INITIAL: EtatListe = { tri: null, page: 0, taillePage: TAILLE_PAGE_DEFAUT, filtre: null };

/** Contrôle d'un état relu de la mémoire du navigateur (données non fiables). */
export function estEtatListe(v: unknown): v is EtatListe {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  const triOk =
    e.tri === null ||
    (typeof e.tri === "object" &&
      e.tri !== null &&
      typeof (e.tri as Record<string, unknown>).cle === "string" &&
      ((e.tri as Record<string, unknown>).sens === "asc" || (e.tri as Record<string, unknown>).sens === "desc"));
  return (
    triOk &&
    Number.isInteger(e.page) &&
    (e.page as number) >= 0 &&
    (TAILLES_PAGE as readonly number[]).includes(e.taillePage as number) &&
    (e.filtre === null || typeof e.filtre === "string")
  );
}

const collateur = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

/** Vides toujours en dernier, quel que soit le sens. */
export function comparerValeurs(a: ValeurTri, b: ValeurTri): number {
  const videA = a === null || a === undefined || a === "";
  const videB = b === null || b === undefined || b === "";
  if (videA || videB) return videA === videB ? 0 : videA ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return collateur.compare(String(a), String(b));
}

/** Tri stable ; les valeurs vides restent en fin de liste dans les deux sens. */
export function trierLignes<T>(lignes: readonly T[], valeur: (l: T) => ValeurTri, sens: SensTri): T[] {
  return lignes
    .map((l, i) => ({ l, i, v: valeur(l) }))
    .sort((x, y) => {
      const videX = x.v === null || x.v === undefined || x.v === "";
      const videY = y.v === null || y.v === undefined || y.v === "";
      if (videX || videY) return videX === videY ? x.i - y.i : videX ? 1 : -1;
      return (sens === "asc" ? comparerValeurs(x.v, y.v) : comparerValeurs(y.v, x.v)) || x.i - y.i;
    })
    .map((x) => x.l);
}

/** Croissant, puis décroissant, puis retour à l'ordre d'origine. */
export function basculerTri(tri: TriListe | null, cle: string): TriListe | null {
  if (!tri || tri.cle !== cle) return { cle, sens: "asc" };
  return tri.sens === "asc" ? { cle, sens: "desc" } : null;
}

export interface PageListe<T> {
  lignes: T[];
  page: number;
  pages: number;
  debut: number;
  fin: number;
  total: number;
}

/** Page demandée ramenée dans les bornes (une liste qui rétrécit ne montre jamais une page vide). */
export function paginer<T>(lignes: readonly T[], page: number, taille: number): PageListe<T> {
  const total = lignes.length;
  const pages = Math.max(1, Math.ceil(total / taille));
  const p = Math.min(Math.max(0, page), pages - 1);
  const debut = p * taille;
  const vue = lignes.slice(debut, debut + taille);
  return { lignes: vue, page: p, pages, debut: total === 0 ? 0 : debut + 1, fin: debut + vue.length, total };
}

/** « 1–25 sur 84 véhicules », « 1 véhicule », « Aucun véhicule ». */
export function texteCompteur(p: Pick<PageListe<unknown>, "debut" | "fin" | "total">, libelles: readonly [string, string] = ["élément", "éléments"]): string {
  if (p.total === 0) return `Aucun ${libelles[0]}`;
  const nom = p.total > 1 ? libelles[1] : libelles[0];
  if (p.debut === 1 && p.fin === p.total) return `${p.total} ${nom}`;
  return `${p.debut}–${p.fin} sur ${p.total} ${nom}`;
}

export interface OptionFiltre {
  valeur: string;
  libelle: string;
}

export interface PastilleFiltre extends OptionFiltre {
  nombre: number;
}

/** Pastilles du filtre rapide avec leur nombre ; « Tous » en tête ; options vides masquées sauf si choisies. */
export function pastillesFiltre<T>(
  lignes: readonly T[],
  valeur: (l: T) => string,
  options: readonly OptionFiltre[],
  choisi: string | null,
  libelleTous = "Tous",
): PastilleFiltre[] {
  const nombres = new Map<string, number>();
  for (const l of lignes) nombres.set(valeur(l), (nombres.get(valeur(l)) ?? 0) + 1);
  return [
    { valeur: "", libelle: libelleTous, nombre: lignes.length },
    ...options.map((o) => ({ ...o, nombre: nombres.get(o.valeur) ?? 0 })).filter((o) => o.nombre > 0 || o.valeur === choisi),
  ];
}

export function filtrerLignes<T>(lignes: readonly T[], valeur: (l: T) => string, choisi: string | null): T[] {
  return choisi ? lignes.filter((l) => valeur(l) === choisi) : [...lignes];
}

/** Minuscules sans accents, espaces réduits. */
export function normaliserRecherche(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Tous les mots tapés doivent se trouver dans le texte de la ligne (« hilux panne »). */
export function rechercherLignes<T>(lignes: readonly T[], texte: (l: T) => string, terme: string): T[] {
  const mots = normaliserRecherche(terme).split(" ").filter(Boolean);
  if (mots.length === 0) return [...lignes];
  return lignes.filter((l) => {
    const t = normaliserRecherche(texte(l));
    return mots.every((m) => t.includes(m));
  });
}
