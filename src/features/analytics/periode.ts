/**
 * Périodes et regroupements dans le temps de la page Analytique (refonte du
 * 2026-09-25). Logique pure, sans bibliothèque de dates : testable seule.
 * Toutes les dates sont en heure locale ; un intervalle est [debut, fin[.
 */
export type PeriodeAnalyse = "7j" | "30j" | "3m" | "12m" | "annee";
export type Granularite = "jour" | "semaine" | "mois";

export const LIBELLES_PERIODE: Record<PeriodeAnalyse, string> = {
  "7j": "7 derniers jours",
  "30j": "30 derniers jours",
  "3m": "3 derniers mois",
  "12m": "12 derniers mois",
  annee: "Année en cours",
};

export const LIBELLES_GRANULARITE: Record<Granularite, string> = { jour: "Jour", semaine: "Semaine", mois: "Mois" };

export interface Intervalle {
  debut: Date;
  fin: Date;
}

export interface Seau {
  cle: string;
  libelle: string;
  debut: Date;
  fin: Date;
}

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function jour(date: Date, decalage = 0): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + decalage);
}

function deuxChiffres(n: number): string {
  return String(n).padStart(2, "0");
}

/** Période choisie, jusqu'à la fin d'aujourd'hui incluse. */
export function intervallePeriode(periode: PeriodeAnalyse, maintenant: Date): Intervalle {
  const fin = jour(maintenant, 1);
  switch (periode) {
    case "7j":
      return { debut: jour(maintenant, -6), fin };
    case "30j":
      return { debut: jour(maintenant, -29), fin };
    case "3m":
      return { debut: jour(maintenant, -89), fin };
    case "12m":
      return { debut: new Date(maintenant.getFullYear(), maintenant.getMonth() - 11, 1), fin };
    case "annee":
      return { debut: new Date(maintenant.getFullYear(), 0, 1), fin };
  }
}

/** Période précédente de même durée, juste avant (pour la comparaison). */
export function intervallePrecedent({ debut, fin }: Intervalle): Intervalle {
  const duree = fin.getTime() - debut.getTime();
  return { debut: new Date(debut.getTime() - duree), fin: new Date(debut.getTime()) };
}

export function granularitesPossibles(periode: PeriodeAnalyse): Granularite[] {
  if (periode === "7j") return ["jour"];
  if (periode === "30j") return ["jour", "semaine"];
  if (periode === "3m") return ["jour", "semaine", "mois"];
  return ["semaine", "mois"];
}

export function granulariteParDefaut(periode: PeriodeAnalyse): Granularite {
  return periode === "7j" || periode === "30j" ? "jour" : periode === "3m" ? "semaine" : "mois";
}

function debutSeau(date: Date, granularite: Granularite): Date {
  if (granularite === "jour") return jour(date);
  if (granularite === "mois") return new Date(date.getFullYear(), date.getMonth(), 1);
  const lundi = (date.getDay() + 6) % 7;
  return jour(date, -lundi);
}

function suivant(date: Date, granularite: Granularite): Date {
  if (granularite === "jour") return jour(date, 1);
  if (granularite === "semaine") return jour(date, 7);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function libelleSeau(debut: Date, granularite: Granularite): string {
  const jj = `${deuxChiffres(debut.getDate())}/${deuxChiffres(debut.getMonth() + 1)}`;
  if (granularite === "jour") return jj;
  if (granularite === "semaine") return `sem. ${jj}`;
  return `${MOIS_COURTS[debut.getMonth()]} ${String(debut.getFullYear()).slice(2)}`;
}

/** Découpage de l'intervalle en jours, semaines (du lundi) ou mois, coupés aux bornes de l'intervalle. */
export function seauxTemporels({ debut, fin }: Intervalle, granularite: Granularite): Seau[] {
  const seaux: Seau[] = [];
  let courant = debutSeau(debut, granularite);
  while (courant < fin) {
    const prochain = suivant(courant, granularite);
    const d = courant < debut ? debut : courant;
    const f = prochain > fin ? fin : prochain;
    seaux.push({ cle: d.toISOString(), libelle: libelleSeau(courant, granularite), debut: d, fin: f });
    courant = prochain;
  }
  return seaux;
}

/** Date ISO (« 2026-09-25 » ou date-heure) → Date locale ; null si absente ou invalide. */
export function lireDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function dansIntervalle(date: Date | null, { debut, fin }: Intervalle): boolean {
  return date !== null && date >= debut && date < fin;
}
