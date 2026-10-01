import type { StatutEngin } from "@/types/engin";
import type { Mission, StatutMission } from "@/types/mission";

/**
 * Règles d'action sur une mission côté écran, alignées sur le serveur
 * (MissionService et CoherenceMission) — le serveur reste l'autorité :
 *  - modifier : mission PLANIFIEE (tout se modifie) ou EN_COURS (le serveur
 *    n'accepte alors que le motif et les dates) ; jamais TERMINEE ni ANNULEE ;
 *    réservé à GERER_PARC : DG et RESPONSABLE_PARC (PUT /api/missions/{id}, lib/droits.ts) ;
 *  - démarrer (2026-10-01) : mission PLANIFIEE, à partir du JOUR de début
 *    prévu (un retard reste possible), véhicule encore disponible ;
 *  - terminer : mission EN_COURS ; une fin rapide (moins de 15 min ou aucun
 *    déplacement) est signalée par le serveur (422) et demande une confirmation.
 */
const STATUTS_MODIFIABLES: readonly StatutMission[] = ["PLANIFIEE", "EN_COURS"];

export function missionModifiable(mission: Pick<Mission, "statut">): boolean {
  return STATUTS_MODIFIABLES.includes(mission.statut);
}

const LIBELLES_STATUT_MISSION: Record<StatutMission, string> = {
  PLANIFIEE: "planifiée",
  EN_COURS: "déjà en cours",
  TERMINEE: "terminée",
  ANNULEE: "annulée",
};

const LIBELLES_STATUT_VEHICULE: Record<StatutEngin, string> = {
  DISPONIBLE: "disponible",
  AFFECTE: "affecté à un conducteur",
  EN_MISSION: "déjà en mission",
  EN_PANNE: "en panne",
  EN_MAINTENANCE: "en maintenance",
  REFORME: "réformé",
  VENDU: "vendu",
};

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** « 08/10/2026 à 07:00 » — même format que le message du serveur. */
function jourEtHeure(iso: string): string {
  const d = new Date(iso);
  return `${deuxChiffres(d.getDate())}/${deuxChiffres(d.getMonth() + 1)}/${d.getFullYear()} à ${deuxChiffres(d.getHours())}:${deuxChiffres(d.getMinutes())}`;
}

/** Début du jour local d'une date ISO sans fuseau (« 2026-10-08T07:00:00 »). */
function jourDe(iso: string): Date {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Pourquoi la mission ne peut pas démarrer aujourd'hui, ou `null` si le
 * bouton « Démarrer » peut être proposé. Mêmes textes que le serveur.
 */
export function motifDemarrageImpossible(
  mission: Pick<Mission, "statut" | "dateDebutPrevue"> & { engin?: { statut?: StatutEngin } | null },
  maintenant: Date = new Date(),
): string | null {
  if (mission.statut !== "PLANIFIEE") {
    return `Seule une mission planifiée peut démarrer (mission ${LIBELLES_STATUT_MISSION[mission.statut]}).`;
  }
  const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  if (aujourdhui < jourDe(mission.dateDebutPrevue)) {
    return `Mission prévue le ${jourEtHeure(mission.dateDebutPrevue)} : elle ne peut pas démarrer avant ce jour. Pour partir plus tôt, modifiez d'abord la date de début.`;
  }
  const statutVehicule = mission.engin?.statut;
  if (statutVehicule && statutVehicule !== "DISPONIBLE") {
    return `Le véhicule n'est pas disponible (${LIBELLES_STATUT_VEHICULE[statutVehicule]}) : la mission ne peut pas démarrer.`;
  }
  return null;
}
