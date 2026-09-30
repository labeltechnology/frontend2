import type { PrevisionMois } from "@/types/chantier";

/**
 * Analyse du matériel sur les chantiers (V64, 2026-09-29) — logique pure :
 * séries de la charge prévue par mois (barres empilées par type de chantier).
 */

/** Types de chantier présents dans la prévision, du plus chargé au moins chargé. */
export function typesDeLaPrevision(prevision: PrevisionMois[]): string[] {
  const totaux = new Map<string, number>();
  for (const m of prevision) {
    for (const [type, jours] of Object.entries(m.joursParType)) totaux.set(type, (totaux.get(type) ?? 0) + jours);
  }
  return [...totaux.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr")).map(([t]) => t);
}

/** Hauteur (%) d'un segment par rapport au mois le plus chargé. */
export function hauteur(jours: number, prevision: PrevisionMois[]): number {
  const max = Math.max(0, ...prevision.map((m) => m.total));
  return max === 0 ? 0 : Math.round((jours / max) * 100);
}

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « 2026-10 » → « oct. 26 ». */
export function libelleMois(mois: string): string {
  const [a, m] = mois.split("-").map(Number);
  return `${MOIS[m - 1]} ${String(a).slice(2)}`;
}

/** Pic de charge : mois (à venir compris) avec le plus de jours-véhicule ; null si tout est vide. */
export function moisLePlusCharge(prevision: PrevisionMois[]): PrevisionMois | null {
  return prevision.reduce<PrevisionMois | null>((max, m) => (m.total > (max?.total ?? 0) ? m : max), null);
}

export const COULEURS_TYPES = ["bg-primary", "bg-amber-500", "bg-emerald-500", "bg-sky-500", "bg-rose-500", "bg-violet-500", "bg-muted-foreground"];
