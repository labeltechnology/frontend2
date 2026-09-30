/**
 * Tableau à exporter en Excel (2026-09-29), sans dépendance : formats de
 * colonne et nom de fichier. L'envoi au serveur est dans export-excel.ts.
 */
export type FormatColonneExport = "TEXTE" | "NOMBRE" | "DECIMAL" | "MONTANT" | "POURCENT";

export interface TableauExport {
  titre: string;
  sousTitre?: string;
  colonnes: { libelle: string; format: FormatColonneExport }[];
  lignes: (string | number | null)[][];
}

/** Même règle que le serveur (TableauExcel.nomFichier) : « Évolution — coût total » → « evolution-cout-total.xlsx ». */
export function nomFichierExport(titre: string): string {
  const base = titre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${(base || "export").slice(0, 60)}.xlsx`;
}
