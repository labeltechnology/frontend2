import { peut, ROLES_PAR_CAPACITE } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";

/** Rôles autorisés à déclarer un incident — IncidentController#declarer (Droits.SAISIE_TERRAIN). Source : lib/droits.ts. */
export const ROLES_DECLARATION_INCIDENT = ROLES_PAR_CAPACITE.SAISIE_TERRAIN;

export function peutDeclarerIncident(role: RoleLibelle | undefined): boolean {
  return peut(role, "SAISIE_TERRAIN");
}
