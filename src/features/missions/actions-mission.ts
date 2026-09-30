import type { Mission, StatutMission } from "@/types/mission";

/**
 * Règles d'action sur une mission côté écran (2026-09-25), alignées sur
 * MissionService côté serveur — le serveur reste l'autorité :
 *  - modifier : mission PLANIFIEE (tout se modifie) ou EN_COURS (le serveur
 *    n'accepte alors que le motif et les dates) ; jamais TERMINEE ni ANNULEE ;
 *  - réservé à GERER_PARC : DG et RESPONSABLE_PARC (PUT /api/missions/{id}, lib/droits.ts).
 */
const STATUTS_MODIFIABLES: readonly StatutMission[] = ["PLANIFIEE", "EN_COURS"];

export function missionModifiable(mission: Pick<Mission, "statut">): boolean {
  return STATUTS_MODIFIABLES.includes(mission.statut);
}
