import { definitionRapport, type FamilleRapport } from "@/features/rapports/catalogue";
import type { Rapport } from "@/types/rapport";

/** Règles pures de la liste de la page Rapports (2026-09-28), testées. */

export type FiltreGeneration = "TOUS" | "SEPT_JOURS" | "TRENTE_JOURS";

export interface FiltresRapports {
  recherche: string;
  famille: FamilleRapport | "TOUTES";
  generation: FiltreGeneration;
}

export const FILTRES_RAPPORTS_DEFAUT: FiltresRapports = { recherche: "", famille: "TOUTES", generation: "TOUS" };

function dateFr(iso: string): string {
  const [a, m, j] = iso.slice(0, 10).split("-");
  return `${j}/${m}/${a}`;
}

/** « 01/09/2026 → 30/09/2026 », « Depuis le … », « Jusqu'au … », « Sans période ». */
export function libellePeriode(r: Pick<Rapport, "dateDebutPeriode" | "dateFinPeriode">): string {
  if (r.dateDebutPeriode && r.dateFinPeriode) return `${dateFr(r.dateDebutPeriode)} → ${dateFr(r.dateFinPeriode)}`;
  if (r.dateDebutPeriode) return `Depuis le ${dateFr(r.dateDebutPeriode)}`;
  if (r.dateFinPeriode) return `Jusqu'au ${dateFr(r.dateFinPeriode)}`;
  return "Sans période";
}

function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function filtrerRapports(rapports: readonly Rapport[], filtres: FiltresRapports, maintenant: Date): Rapport[] {
  const mots = sansAccents(filtres.recherche.trim()).split(/\s+/).filter(Boolean);
  const joursMax = filtres.generation === "SEPT_JOURS" ? 7 : filtres.generation === "TRENTE_JOURS" ? 30 : null;
  const limite = joursMax === null ? null : maintenant.getTime() - joursMax * 86_400_000;
  return rapports.filter((r) => {
    const def = definitionRapport(r.type);
    if (filtres.famille !== "TOUTES" && def.famille !== filtres.famille) return false;
    if (limite !== null && new Date(r.dateGeneration).getTime() < limite) return false;
    if (mots.length === 0) return true;
    const texte = sansAccents(`${def.titre} ${r.libelleCible ?? "tout le parc"} ${libellePeriode(r)} n°${r.idRapport}`);
    return mots.every((mot) => texte.includes(mot));
  });
}

/** Du plus récent au plus ancien. */
export function trierRapports(rapports: readonly Rapport[]): Rapport[] {
  return [...rapports].sort((a, b) => b.dateGeneration.localeCompare(a.dateGeneration) || b.idRapport - a.idRapport);
}

/** Nombre de rapports par famille (pastilles des filtres). */
export function compterParFamille(rapports: readonly Rapport[]): Record<FamilleRapport, number> {
  const compte: Record<FamilleRapport, number> = { SYNTHESES: 0, ACTIVITE: 0, FINANCES: 0, PARC: 0 };
  for (const r of rapports) compte[definitionRapport(r.type).famille]++;
  return compte;
}

/** Nom du fichier téléchargé : « rapport-synthese-generale-42.pdf ». */
export function nomFichierRapport(r: Pick<Rapport, "type" | "idRapport">, extension: "pdf" | "xlsx"): string {
  const titre = sansAccents(definitionRapport(r.type).titre).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `rapport-${titre}-${r.idRapport}.${extension}`;
}
