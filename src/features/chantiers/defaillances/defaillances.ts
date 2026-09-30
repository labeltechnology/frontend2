import type { CauseDefaillance, Defaillance, LignePareto } from "@/types/chantier";

/**
 * Défaillances d'un chantier (V64, 2026-09-29) — logique pure : libellés des
 * causes et des types, tri, largeur des barres du Pareto.
 */

export const LIBELLES_CAUSE: Record<CauseDefaillance, string> = {
  USURE: "Usure normale",
  MAUVAISE_UTILISATION: "Mauvaise utilisation",
  DEFAUT_MATERIEL: "Défaut du matériel",
  ACCIDENT: "Accident",
  ENVIRONNEMENT: "Conditions du chantier (terrain, météo)",
  AUTRE: "Autre",
};

export const CAUSES: CauseDefaillance[] = ["USURE", "MAUVAISE_UTILISATION", "DEFAUT_MATERIEL", "ACCIDENT", "ENVIRONNEMENT", "AUTRE"];

const LIBELLES_TYPE: Record<string, string> = {
  ACCIDENT: "Accident",
  PANNE: "Panne",
  VOL: "Vol",
  AUTRE: "Autre incident",
  DEGATS: "Dégâts",
  CORRECTIVE: "Maintenance corrective",
  PREVENTIVE: "Maintenance préventive",
};

export function libelleTypeDefaillance(d: Pick<Defaillance, "type" | "nature">): string {
  if (d.type && LIBELLES_TYPE[d.type]) return LIBELLES_TYPE[d.type];
  return d.nature === "INCIDENT" ? "Incident" : "Maintenance";
}

/** Une défaillance « à expliquer » : sans cause (hors maintenance préventive). */
export function sansCause(d: Defaillance): boolean {
  return d.cause === null && !(d.nature === "MAINTENANCE" && d.type === "PREVENTIVE");
}

/** Les plus récentes d'abord, puis par véhicule. */
export function trierDefaillances(liste: Defaillance[]): Defaillance[] {
  return [...liste].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || (a.vehicule ?? "").localeCompare(b.vehicule ?? "", "fr"));
}

/** Largeur (%) de chaque barre du Pareto, relative à la cause la plus fréquente. */
export function largeursPareto(lignes: LignePareto[]): number[] {
  const max = Math.max(0, ...lignes.map((l) => l.nombre));
  return lignes.map((l) => (max === 0 ? 0 : Math.round((l.nombre / max) * 100)));
}
