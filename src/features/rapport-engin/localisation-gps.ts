import type { LocalisationVehicule, PositionGps } from "@/types/gps";

/**
 * Règles pures de la carte GPS de la rubrique « Localisation » du rapport
 * véhicule (2026-09-28). Aucune dépendance React ni Leaflet : testables seules.
 * La situation (équipé, boîtier actif, position) vient du serveur
 * (GET /api/gps/engins/{idEngin}/localisation) ; l'écran calcule l'ancienneté.
 */

/** Au-delà de ce délai sans transmission, la position est signalée comme ancienne. */
export const MINUTES_POSITION_RECENTE = 60;
/** Fenêtre du tracé affiché derrière le repère (positions des dernières heures). */
export const HEURES_TRACE = 24;

/** Dernière position utilisable sur la carte. */
export interface PointVehicule {
  idDispositifGps: number;
  numeroSerie: string;
  latitude: number;
  longitude: number;
  vitesse: number;
  horodatage: string;
}

export type EtatLocalisation =
  /** Aucun boîtier GPS relié à ce véhicule. */
  | { type: "non-equipe" }
  /** Boîtier désactivé : pas de suivi. */
  | { type: "inactif"; numeroSerie: string }
  /** Boîtier déclaré hors service. */
  | { type: "hors-service"; numeroSerie: string }
  /** Boîtier actif, mais aucune position reçue pour l'instant. */
  | { type: "sans-position"; numeroSerie: string }
  | {
      type: "position";
      point: PointVehicule;
      /** Minutes écoulées depuis la dernière transmission (0 si l'horloge du boîtier est en avance). */
      ageMinutes: number;
      recente: boolean;
    };

/**
 * Traduit la réponse du serveur pour l'écran. Réponse incohérente (POSITION
 * sans coordonnées, boîtier sans numéro) : traitée comme l'état le plus prudent
 * (« aucune position » / « non équipé ») plutôt que d'afficher un repère faux.
 */
export function etatLocalisation(localisation: LocalisationVehicule, maintenant: Date): EtatLocalisation {
  const numeroSerie = localisation.numeroSerie;
  if (localisation.etat === "NON_EQUIPE" || numeroSerie === null) return { type: "non-equipe" };
  if (localisation.etat === "INACTIF") return { type: "inactif", numeroSerie };
  if (localisation.etat === "HORS_SERVICE") return { type: "hors-service", numeroSerie };

  const { idDispositifGps, latitude, longitude, vitesse, horodatage } = localisation;
  if (
    localisation.etat !== "POSITION" ||
    idDispositifGps === null ||
    latitude === null ||
    longitude === null ||
    horodatage === null
  ) {
    return { type: "sans-position", numeroSerie };
  }
  const ageMinutes = Math.max(0, Math.floor((maintenant.getTime() - new Date(horodatage).getTime()) / 60_000));
  return {
    type: "position",
    point: { idDispositifGps, numeroSerie, latitude, longitude, vitesse: vitesse ?? 0, horodatage },
    ageMinutes,
    recente: ageMinutes <= MINUTES_POSITION_RECENTE,
  };
}

/**
 * Tracé récent, dans l'ordre chronologique : le serveur renvoie les positions
 * de la plus récente à la plus ancienne ; on garde celles des `heures`
 * dernières heures. Moins de 2 points → pas de tracé.
 */
export function traceRecente(
  positions: readonly PositionGps[] | undefined,
  maintenant: Date,
  heures: number = HEURES_TRACE,
): [number, number][] {
  if (!positions) return [];
  const limite = maintenant.getTime() - heures * 3_600_000;
  const points = positions
    .filter((p) => new Date(p.horodatage).getTime() >= limite)
    .sort((a, b) => a.horodatage.localeCompare(b.horodatage))
    .map<[number, number]>((p) => [p.latitude, p.longitude]);
  return points.length >= 2 ? points : [];
}

/** Texte affiché à la place de la carte quand il n'y a pas de position. */
export function messageSansPosition(etat: Exclude<EtatLocalisation, { type: "position" }>): string {
  switch (etat.type) {
    case "non-equipe":
      return "Véhicule non équipé de GPS : pas de position en direct.";
    case "inactif":
      return `Boîtier GPS ${etat.numeroSerie} inactif : pas de position en direct.`;
    case "hors-service":
      return `Boîtier GPS ${etat.numeroSerie} hors service : pas de position en direct.`;
    case "sans-position":
      return `Boîtier GPS ${etat.numeroSerie} actif, aucune position reçue pour l'instant.`;
  }
}

/** « à l'instant », « il y a 12 min », « il y a 3 h », « il y a 2 j ». */
export function libelleAnciennete(ageMinutes: number): string {
  if (ageMinutes < 1) return "à l'instant";
  if (ageMinutes < 60) return `il y a ${ageMinutes} min`;
  const heures = Math.floor(ageMinutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.floor(heures / 24)} j`;
}
