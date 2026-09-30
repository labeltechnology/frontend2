/**
 * Périodes toutes prêtes du formulaire de rapport (2026-09-28) : un clic
 * remplit le début et la fin. Dates locales au format AAAA-MM-JJ (champ date).
 */
export type ClePeriode = "CE_MOIS" | "MOIS_DERNIER" | "SEPT_JOURS" | "TRENTE_JOURS" | "TRIMESTRE" | "CETTE_ANNEE";

export const PERIODES: { cle: ClePeriode; libelle: string }[] = [
  { cle: "CE_MOIS", libelle: "Ce mois" },
  { cle: "MOIS_DERNIER", libelle: "Mois dernier" },
  { cle: "SEPT_JOURS", libelle: "7 derniers jours" },
  { cle: "TRENTE_JOURS", libelle: "30 derniers jours" },
  { cle: "TRIMESTRE", libelle: "Ce trimestre" },
  { cle: "CETTE_ANNEE", libelle: "Cette année" },
];

export function versChampDate(date: Date): string {
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mois}-${jour}`;
}

export function bornesPeriode(cle: ClePeriode, aujourdhui: Date): { debut: string; fin: string } {
  const a = aujourdhui.getFullYear();
  const m = aujourdhui.getMonth();
  const jour = (annee: number, mois: number, j: number) => versChampDate(new Date(annee, mois, j));
  switch (cle) {
    case "CE_MOIS":
      return { debut: jour(a, m, 1), fin: jour(a, m + 1, 0) };
    case "MOIS_DERNIER":
      return { debut: jour(a, m - 1, 1), fin: jour(a, m, 0) };
    case "SEPT_JOURS":
      return { debut: jour(a, m, aujourdhui.getDate() - 6), fin: versChampDate(aujourdhui) };
    case "TRENTE_JOURS":
      return { debut: jour(a, m, aujourdhui.getDate() - 29), fin: versChampDate(aujourdhui) };
    case "TRIMESTRE": {
      const premierMois = Math.floor(m / 3) * 3;
      return { debut: jour(a, premierMois, 1), fin: jour(a, premierMois + 3, 0) };
    }
    case "CETTE_ANNEE":
      return { debut: jour(a, 0, 1), fin: jour(a, 11, 31) };
  }
}

/** Période actuellement sélectionnée si elle correspond à un raccourci, sinon null. */
export function periodeCorrespondante(debut: string, fin: string, aujourdhui: Date): ClePeriode | null {
  for (const { cle } of PERIODES) {
    const bornes = bornesPeriode(cle, aujourdhui);
    if (bornes.debut === debut && bornes.fin === fin) return cle;
  }
  return null;
}
