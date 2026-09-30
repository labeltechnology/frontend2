import L from "leaflet";

/**
 * Couleurs et repère rond des véhicules sur les cartes GPS, selon le statut
 * du véhicule. Sortis de FlotteMap.tsx le 2026-09-28 pour être partagés avec
 * la carte « Localisation » du rapport véhicule (même code couleur partout).
 */
export const COULEUR_PAR_STATUT: Record<string, string> = {
  DISPONIBLE: "#16a34a",
  AFFECTE: "#64748b",
  EN_MISSION: "#2563eb",
  EN_PANNE: "#dc2626",
  EN_MAINTENANCE: "#d97706",
};
export const COULEUR_DEFAUT = "#6b7280";

export function iconePourStatut(statut: string, taille = 16): L.DivIcon {
  const couleur = COULEUR_PAR_STATUT[statut] ?? COULEUR_DEFAUT;
  const demi = taille / 2;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:${taille}px;height:${taille}px;border-radius:9999px;background:${couleur};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.6);"></span>`,
    iconSize: [taille, taille],
    iconAnchor: [demi, demi],
    popupAnchor: [0, -demi],
  });
}
