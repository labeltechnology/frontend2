import { formatDate } from "@/lib/utils";
import type { StatutChantier } from "@/types/chantier";
import type { ChantierCarte, SourcePerimetre, VehiculeChantierCarte } from "@/types/carte-gps";

/**
 * Chantiers sur la carte GPS (2026-09-30) — logique pure, sans React ni Leaflet
 * (testable sous Node : ne pas importer zone-chantier-rendu, qui charge Leaflet).
 */

/** Sommets [lat, lng] d'un Point, d'une LineString ou d'un Polygon GeoJSON ; [] si illisible. */
export function sommetsGeoJson(geometrieGeoJson: string): [number, number][] {
  try {
    const g = JSON.parse(geometrieGeoJson) as { type?: string; coordinates?: unknown };
    const inverser = (c: unknown): [number, number] | null =>
      Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number" ? [c[1], c[0]] : null;
    const liste = (cs: unknown): [number, number][] =>
      Array.isArray(cs) ? cs.map(inverser).filter((p): p is [number, number] => p !== null) : [];
    if (g.type === "Point") {
      const p = inverser(g.coordinates);
      return p ? [p] : [];
    }
    if (g.type === "LineString") return liste(g.coordinates);
    if (g.type === "Polygon" && Array.isArray(g.coordinates)) return liste(g.coordinates[0]);
    return [];
  } catch {
    return [];
  }
}

export const COULEUR_STATUT_CHANTIER: Record<StatutChantier, string> = {
  PLANIFIE: "#64748b",
  EN_COURS: "#d97706",
  TERMINE: "#16a34a",
  ANNULE: "#dc2626",
};

export const LIBELLE_STATUT_CHANTIER: Record<StatutChantier, string> = {
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

/** Où poser le repère : la position du chantier, sinon le premier point de son plan ; null si rien. */
export function centreChantier(c: ChantierCarte): [number, number] | null {
  if (c.latitude != null && c.longitude != null) return [c.latitude, c.longitude];
  for (const zone of c.zones) {
    const [premier] = sommetsGeoJson(zone.geometrieGeoJson);
    if (premier) return premier;
  }
  return null;
}

/** Tous les points utiles pour cadrer la carte sur un chantier (repère + plan). */
export function pointsChantier(c: ChantierCarte): [number, number][] {
  const points: [number, number][] = [];
  if (c.latitude != null && c.longitude != null) points.push([c.latitude, c.longitude]);
  for (const zone of c.zones) points.push(...sommetsGeoJson(zone.geometrieGeoJson));
  return points;
}

export function textePerimetre(source: SourcePerimetre, rayon: number): string {
  if (source === "ZONES") return `Zones du plan (à ${rayon} m près des points et du tracé)`;
  if (source === "RAYON") return `${rayon} m autour du repère`;
  return "Non localisable : placez le chantier ou tracez son plan";
}

export type TonSituation = "dedans" | "dehors" | "inconnu" | "a-venir";

export interface SituationVehicule {
  idChantier: number;
  nomChantier: string;
  texte: string;
  ton: TonSituation;
}

/** Situation d'un véhicule vis-à-vis d'un de ses chantiers. */
export function situation(v: VehiculeChantierCarte, nomChantier: string): Omit<SituationVehicule, "idChantier"> {
  const nom = `« ${nomChantier} »`;
  if (!v.prevuAujourdhui) {
    const debut = v.dateDebutPrevue ? ` à partir du ${formatDate(v.dateDebutPrevue)}` : "";
    return { nomChantier, texte: `Prévu sur ${nom}${debut}`, ton: "a-venir" };
  }
  if (v.surPlace === true) return { nomChantier, texte: `Sur le chantier ${nom}`, ton: "dedans" };
  if (v.surPlace === false) return { nomChantier, texte: `Hors du chantier ${nom} (prévu aujourd'hui)`, ton: "dehors" };
  return { nomChantier, texte: `Prévu sur ${nom} : position inconnue`, ton: "inconnu" };
}

/** Chantiers d'un véhicule (bulle du véhicule sur la carte) : ceux d'aujourd'hui d'abord. */
export function situationsDuVehicule(idEngin: number, chantiers: readonly ChantierCarte[]): SituationVehicule[] {
  const rang: Record<TonSituation, number> = { dedans: 0, dehors: 1, inconnu: 2, "a-venir": 3 };
  const resultat: SituationVehicule[] = [];
  for (const c of chantiers) {
    for (const v of c.vehicules) {
      if (v.idEngin === idEngin) resultat.push({ idChantier: c.idChantier, ...situation(v, c.nom) });
    }
  }
  return resultat.sort((a, b) => rang[a.ton] - rang[b.ton]);
}

/** « 3 véhicules : 2 sur place, 1 hors du chantier » (bulle du chantier). */
export function resumeVehicules(c: ChantierCarte): string {
  const n = c.vehicules.length;
  if (n === 0) return "Aucun véhicule rattaché";
  const aujourdhui = c.vehicules.filter((v) => v.prevuAujourdhui);
  const dedans = aujourdhui.filter((v) => v.surPlace === true).length;
  const dehors = aujourdhui.filter((v) => v.surPlace === false).length;
  const parties: string[] = [];
  if (dedans) parties.push(`${dedans} sur place`);
  if (dehors) parties.push(`${dehors} hors du chantier`);
  const inconnus = aujourdhui.length - dedans - dehors;
  if (inconnus) parties.push(`${inconnus} sans position`);
  const avenir = n - aujourdhui.length;
  if (avenir) parties.push(`${avenir} à venir`);
  return `${n} véhicule${n > 1 ? "s" : ""} : ${parties.join(", ")}`;
}

export const COULEUR_TON: Record<TonSituation, string> = {
  dedans: "#16a34a",
  dehors: "#dc2626",
  inconnu: "#6b7280",
  "a-venir": "#64748b",
};
