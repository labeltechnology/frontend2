import L from "leaflet";
import type { TypeZoneChantier } from "@/types/chantier";

/**
 * Rendu partagé des zones de chantier (icônes, extraction de points,
 * conversions GeoJSON), utilisé à la fois par la carte d'ensemble
 * (ChantiersMap.tsx, lecture seule) et la page d'édition du plan
 * (PlanChantierPage.tsx, boîte à outils) — évite de dupliquer cette logique
 * dans les deux fichiers (règle du projet : code modulaire).
 */

export const TYPE_ZONE_LIBELLE: Record<TypeZoneChantier, string> = {
  LOCAL_TECHNIQUE: "Local technique",
  LOCAL_MEDICAL: "Local médical",
  STOCKAGE: "Stockage",
  ROUTE: "Route",
  AUTRE: "Autre",
};

const COULEUR_PAR_TYPE: Record<TypeZoneChantier, string> = {
  LOCAL_TECHNIQUE: "#f59e0b",
  LOCAL_MEDICAL: "#ef4444",
  STOCKAGE: "#3b82f6",
  ROUTE: "#374151",
  AUTRE: "#a855f7",
};

export function couleurParDefautType(type: TypeZoneChantier): string {
  return COULEUR_PAR_TYPE[type];
}

/** Tracé SVG (chemin) et forme du badge par type à icône ponctuelle — AUTRE et ROUTE n'ont pas d'icône (polygone/ligne). */
const ICONE_PAR_TYPE: Partial<Record<TypeZoneChantier, { chemin: string; radius: string }>> = {
  LOCAL_TECHNIQUE: { chemin: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', radius: "6px" },
  LOCAL_MEDICAL: { chemin: '<path d="M12 5v14M5 12h14"/>', radius: "9999px" },
  STOCKAGE: { chemin: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>', radius: "4px" },
};

/**
 * Icône point (maison pour local technique, croix pour local médical, boîte
 * pour stockage) — même patron minimaliste que les marqueurs engin/chantier
 * déjà existants (span + SVG inline dans un DivIcon, pas de composant React).
 */
export function iconePointZoneChantier(type: TypeZoneChantier, couleur?: string): L.DivIcon {
  const c = couleur ?? couleurParDefautType(type);
  const forme = ICONE_PAR_TYPE[type] ?? ICONE_PAR_TYPE.LOCAL_TECHNIQUE!;
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;background:${c};border:2px solid white;border-radius:${forme.radius};box-shadow:0 0 3px rgba(0,0,0,0.6);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${forme.chemin}</svg></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

type GeometrieGeoJson =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

/** Parse une géométrie GeoJSON (Point, LineString ou Polygon) ; `null` si illisible. */
export function parserGeometrie(geometrieGeoJson: string): GeometrieGeoJson | null {
  try {
    return JSON.parse(geometrieGeoJson) as GeometrieGeoJson;
  } catch {
    return null;
  }
}

/**
 * Extrait tous les sommets [lat, lng] d'une géométrie, quel que soit son
 * type — généralise l'ancien `pointsDesZones` qui ne gérait que les
 * polygones (`coordinates[0]`) et cassait silencieusement sur un point ou
 * une ligne.
 */
export function pointsDeGeometrie(geometrieGeoJson: string): [number, number][] {
  const geometrie = parserGeometrie(geometrieGeoJson);
  if (!geometrie) return [];
  if (geometrie.type === "Point") {
    const [lng, lat] = geometrie.coordinates;
    return [[lat, lng]];
  }
  if (geometrie.type === "LineString") {
    return geometrie.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
  }
  return (geometrie.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng] as [number, number]);
}

/** Sommet cliqué sur la carte (convention Leaflet [lat, lng]) -> Point GeoJSON (convention GeoJSON [lng, lat]). */
export function versPointGeoJson([lat, lng]: [number, number]): string {
  return JSON.stringify({ type: "Point", coordinates: [lng, lat] });
}

/** Sommets cliqués sur la carte -> LineString GeoJSON (route) : pas de fermeture, contrairement à un polygone. */
export function versLigneGeoJson(points: [number, number][]): string {
  return JSON.stringify({ type: "LineString", coordinates: points.map(([lat, lng]) => [lng, lat]) });
}

/** Sommets cliqués sur la carte -> Polygon GeoJSON, anneau fermé en répétant le premier point en fin de tableau. */
export function versPolygoneGeoJson(points: [number, number][]): string {
  const anneau = points.map(([lat, lng]) => [lng, lat]);
  anneau.push(anneau[0]);
  return JSON.stringify({ type: "Polygon", coordinates: [anneau] });
}
