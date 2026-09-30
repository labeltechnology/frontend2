import { peut, ROLES_PAR_CAPACITE } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";

/** Rôles autorisés à enregistrer un plein — CarburantController#enregistrer (Droits.SAISIE_TERRAIN). Source : lib/droits.ts. */
export const ROLES_SAISIE_CARBURANT = ROLES_PAR_CAPACITE.SAISIE_TERRAIN;

export function peutSaisirCarburant(role: RoleLibelle | undefined): boolean {
  return peut(role, "SAISIE_TERRAIN");
}
