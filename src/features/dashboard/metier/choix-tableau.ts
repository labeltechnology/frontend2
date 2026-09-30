import { peut } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";

/**
 * Quel tableau de bord pour quel métier (pages par métier, 2026-09-30).
 *
 * - « direction » : DG, responsable du parc, administrateur — pilotage.
 * - « atelier » : chef et assistant maintenance — maintenances, pièces.
 * - « finances » : comptable — dépenses, factures, contrats de location.
 * - « chantier » : chef de chantier — ses chantiers, véhicules sur place.
 * - « exploitation » : assistant du parc (et tout autre rôle du site) —
 *   parc, missions, alertes, documents.
 */
export type TableauBord = "direction" | "exploitation" | "atelier" | "finances" | "chantier";

export function tableauDuRole(role: RoleLibelle | undefined): TableauBord {
  if (peut(role, "PILOTAGE_DIRECTION")) return "direction";
  switch (role) {
    case "CHEF_MAINTENANCE":
    case "ASSISTANT_MAINTENANCE":
      return "atelier";
    case "COMPTABLE":
      return "finances";
    case "CHEF_CHANTIER":
      return "chantier";
    default:
      return "exploitation";
  }
}
