import type { CleMesure } from "@/features/analytics/mesures";
import type { FormatColonneExport, TableauExport } from "@/lib/tableau-export";

/** Format Excel de chaque mesure du graphe (2026-09-29). */
export const FORMAT_MESURE: Record<CleMesure, FormatColonneExport> = {
  coutTotal: "MONTANT",
  carburant: "MONTANT",
  maintenance: "MONTANT",
  litres: "DECIMAL",
  km: "NOMBRE",
  missions: "NOMBRE",
  incidents: "NOMBRE",
};

/** Le tableau du graphe (ce que montre le bouton « Tableau »), prêt pour l'export Excel. */
export function tableauGraphe(
  mesure: { cle: CleMesure; libelle: string },
  points: { libelle: string; valeur: number; precedent?: number }[],
  comparer: boolean,
  contexte: string,
): TableauExport {
  const format = FORMAT_MESURE[mesure.cle];
  return {
    titre: `Analytique — ${mesure.libelle}`,
    sousTitre: contexte,
    colonnes: [
      { libelle: "Période", format: "TEXTE" },
      { libelle: "Période en cours", format },
      ...(comparer ? [{ libelle: "Période précédente", format }] : []),
    ],
    lignes: points.map((p) => (comparer ? [p.libelle, p.valeur, p.precedent ?? 0] : [p.libelle, p.valeur])),
  };
}
