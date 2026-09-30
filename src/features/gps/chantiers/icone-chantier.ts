import L from "leaflet";
import { COULEUR_STATUT_CHANTIER } from "@/features/gps/chantiers/carte-chantiers";
import type { StatutChantier } from "@/types/chantier";

/** Repère d'un chantier sur la carte GPS : casque de chantier sur fond de la couleur du statut (2026-09-30). */
export function iconeChantier(statut: StatutChantier): L.DivIcon {
  const couleur = COULEUR_STATUT_CHANTIER[statut];
  return L.divIcon({
    className: "",
    html:
      `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;` +
      `background:${couleur};border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.6);">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" ` +
      `stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M14 6a6 6 0 0 1 6 6v3"/>` +
      `<path d="M4 15v-3a6 6 0 0 1 6-6"/><rect x="2" y="15" width="20" height="4" rx="1"/></svg></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}
