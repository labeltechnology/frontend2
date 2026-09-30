import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Période affichée par le planning (2026-09-25, « ajouter aussi un affichage
 * mensuel pour le planning ») : la semaine (lundi → dimanche) ou le mois
 * civil entier. Logique pure, testable seule.
 */
export type VuePlanning = "semaine" | "mois";

export const LIBELLES_VUE: Record<VuePlanning, string> = { semaine: "Semaine", mois: "Mois" };

/** Premier jour de la période qui contient `date`. */
export function debutDePeriode(vue: VuePlanning, date: Date): Date {
  return vue === "mois" ? startOfMonth(date) : startOfWeek(date, { locale: fr });
}

/** Tous les jours de la période qui commence à `debut`. */
export function joursDePeriode(vue: VuePlanning, debut: Date): Date[] {
  const fin = vue === "mois" ? endOfMonth(debut) : endOfWeek(debut, { locale: fr });
  return eachDayOfInterval({ start: debut, end: fin });
}

/** Période précédente (-1) ou suivante (+1). */
export function deplacerPeriode(vue: VuePlanning, debut: Date, sens: 1 | -1): Date {
  return vue === "mois" ? addMonths(debut, sens) : addWeeks(debut, sens);
}

/** « septembre 2026 » (mois) ou « 21 sept. – 27 sept. 2026 » (semaine). */
export function libellePeriode(vue: VuePlanning, jours: Date[]): string {
  const debut = jours[0];
  const fin = jours[jours.length - 1];
  if (vue === "mois") return format(debut, "LLLL yyyy", { locale: fr });
  return `${format(debut, "d MMM", { locale: fr })} – ${format(fin, "d MMM yyyy", { locale: fr })}`;
}
