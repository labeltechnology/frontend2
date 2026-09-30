/** Position [latitude, longitude] sur la carte de la fiche chantier (convention Leaflet). */
export type PositionCarte = [number, number];

/** Arrondi à 6 décimales (~10 cm) : au-delà, la précision est illusoire et encombre l'affichage. */
export function arrondirPosition([lat, lng]: PositionCarte): PositionCarte {
  return [Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6];
}
