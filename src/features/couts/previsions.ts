import { NOMS_MOIS, texteMontant } from "@/features/couts/couts";
import { nombreFr } from "@/features/performance/performance";
import type { MoisPrevision, Previsions } from "@/types/prevision";

/**
 * Onglet « Prévisions » de la page Coûts (2026-09-29, question du DG
 * « tendances et projections budget / km »), règles pures. Miroir de
 * prevision/CalculPrevision : moyenne mobile sur 3 mois, projection linéaire
 * sur 12 mois (mois en cours compris).
 */
export type SeriePrevision = "TOTAL" | "CARBURANT" | "KILOMETRES" | "HEURES";

export const SERIES: Record<SeriePrevision, { libelle: string; unite: "Ar" | "km" | "h" }> = {
  TOTAL: { libelle: "Dépenses totales", unite: "Ar" },
  CARBURANT: { libelle: "Carburant", unite: "Ar" },
  KILOMETRES: { libelle: "Kilomètres", unite: "km" },
  HEURES: { libelle: "Heures moteur", unite: "h" },
};

export const FENETRE_MOYENNE = 3;

/** Point du graphe : réel (barre pleine), projection (barre claire), moyenne mobile (ligne), budget (repère). */
export interface PointPrevision {
  mois: string;
  libelle: string;
  nature: MoisPrevision["nature"];
  reel: number | null;
  projection: number | null;
  moyenne: number | null;
  budget: number | null;
}

/** « 2026-09 » → « sept. 2026 ». */
export function libelleMois(mois: string): string {
  const [a, m] = mois.split("-");
  return `${NOMS_MOIS[Number(m) - 1]} ${a}`;
}

/** « 2026-09 » → « sept. 26 » (axe du graphe). */
export function libelleMoisCourt(mois: string): string {
  const [a, m] = mois.split("-");
  return `${NOMS_MOIS[Number(m) - 1]} ${a.slice(2)}`;
}

/** Moyenne du mois et des deux précédents ; null pour les deux premiers ou si une valeur manque. */
export function moyenneMobile(valeurs: (number | null)[], fenetre = FENETRE_MOYENNE): (number | null)[] {
  return valeurs.map((_, i) => {
    if (i + 1 < fenetre) return null;
    const tranche = valeurs.slice(i - fenetre + 1, i + 1);
    if (tranche.some((v) => v === null)) return null;
    return Math.round(((tranche as number[]).reduce((s, v) => s + v, 0) / fenetre) * 100) / 100;
  });
}

function reelDe(m: MoisPrevision, s: SeriePrevision): number | null {
  if (s === "TOTAL") return m.total;
  if (s === "CARBURANT") return m.carburant;
  if (s === "KILOMETRES") return m.kilometres;
  return m.heures;
}

function projectionDe(m: MoisPrevision, s: SeriePrevision): number | null {
  if (s === "TOTAL") return m.projectionTotal;
  if (s === "CARBURANT") return m.projectionCarburant;
  if (s === "KILOMETRES") return m.projectionKilometres;
  return m.projectionHeures;
}

/**
 * Points du graphe pour une série. La moyenne mobile ne porte que sur les
 * mois complets : le mois en cours (partiel) la fausserait. Le budget
 * carburant n'a de sens que pour la série « Carburant ».
 */
export function pointsGraphe(p: Previsions, s: SeriePrevision): PointPrevision[] {
  const complets = p.mois.map((m) => (m.nature === "REEL" ? reelDe(m, s) : null));
  const moyennes = moyenneMobile(complets);
  return p.mois.map((m, i) => ({
    mois: m.mois,
    libelle: libelleMoisCourt(m.mois),
    nature: m.nature,
    reel: m.nature === "PROJECTION" ? null : reelDe(m, s),
    projection: projectionDe(m, s),
    moyenne: m.nature === "REEL" ? moyennes[i] : null,
    budget: s === "CARBURANT" ? m.budgetCarburant : null,
  }));
}

/** Maximum de l'axe (au moins 1 pour éviter une division par zéro). */
export function maximumGraphe(points: PointPrevision[]): number {
  return Math.max(1, ...points.flatMap((p) => [p.reel ?? 0, p.projection ?? 0, p.moyenne ?? 0, p.budget ?? 0]));
}

/** « 1 250 000 Ar », « 3 400 km », « 120 h ». */
export function texteValeur(v: number | null | undefined, s: SeriePrevision): string {
  if (v === null || v === undefined) return "—";
  const unite = SERIES[s].unite;
  return unite === "Ar" ? texteMontant(v) : `${nombreFr(v)} ${unite}`;
}

/** « +12 % par an », « −5 % par an », « stable ». */
export function texteTendance(pourcent: number | null): string {
  if (pourcent === null) return "—";
  if (Math.abs(pourcent) < 1) return "stable";
  const signe = pourcent > 0 ? "+" : "−";
  return `${signe}${nombreFr(Math.abs(pourcent), 1)} % par an`;
}

/** Hausse des dépenses : orange au-delà de 10 %/an ; baisse : vert. Jamais de couleur seule (texte toujours affiché). */
export function classeTendanceDepenses(pourcent: number | null): string | undefined {
  if (pourcent === null || Math.abs(pourcent) < 1) return undefined;
  if (pourcent > 10) return "text-badge-warningFg";
  if (pourcent < 0) return "text-badge-successFg";
  return undefined;
}

/** Écart entre la projection de fin d'année du carburant et le budget : positif = dépassement prévu. */
export function ecartBudgetFinAnnee(p: Pick<Previsions, "finAnneeProjectionCarburant" | "budgetCarburantAnnee">): number | null {
  if (p.finAnneeProjectionCarburant === null || p.budgetCarburantAnnee === null) return null;
  return Math.round((p.finAnneeProjectionCarburant - p.budgetCarburantAnnee) * 100) / 100;
}
