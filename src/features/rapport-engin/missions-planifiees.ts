import { formatDateTime } from "@/lib/utils";
import type { StatutConducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";
import type { Mission } from "@/types/mission";
import type { LigneRapport, NiveauRapport } from "@/features/rapport-engin/niveaux";

/**
 * Missions planifiées du véhicule (2026-09-25), affichées dans la carte
 * « Conducteur » du rapport : qui doit conduire le véhicule, et quand.
 * Logique pure, sans React ni appel réseau.
 *
 * Retenues : missions du véhicule au statut PLANIFIEE (les missions en cours
 * sont déjà dans « Localisation » ; terminées et annulées ignorées),
 * de la plus proche à la plus lointaine.
 *
 * Couleurs d'une ligne :
 *  - vert : mission à venir, conducteur en service ;
 *  - jaune : départ prévu dépassé sans démarrage, ou conducteur en congé ;
 *  - rouge : conducteur suspendu ou inactif (il ne pourra pas partir).
 */
export const MISSIONS_PLANIFIEES_VISIBLES = 3;

const NIVEAU_CONDUCTEUR_MISSION: Record<StatutConducteur, NiveauRapport> = {
  EN_SERVICE: "ok",
  CONGE: "avertissement",
  SUSPENDU: "alerte",
  INACTIF: "alerte",
};

export function missionsPlanifieesDuVehicule(missions: Mission[], engin: Engin): Mission[] {
  return missions
    .filter((m) => m.statut === "PLANIFIEE" && m.engin.idEngin === engin.idEngin)
    .sort((a, b) => a.dateDebutPrevue.localeCompare(b.dateDebutPrevue));
}

export function ligneMissionPlanifiee(mission: Mission, maintenant: Date): LigneRapport {
  const { conducteur } = mission;
  const departDepasse = new Date(mission.dateDebutPrevue).getTime() < maintenant.getTime();
  const niveauConducteur = conducteur ? NIVEAU_CONDUCTEUR_MISSION[conducteur.statut] : "inconnu";
  const niveau: NiveauRapport =
    niveauConducteur === "alerte" ? "alerte" : departDepasse || niveauConducteur === "avertissement" ? "avertissement" : niveauConducteur;

  const nom = conducteur ? `${conducteur.prenom} ${conducteur.nom}` : "Conducteur non renseigné";
  const remarques: string[] = [];
  if (conducteur && conducteur.statut !== "EN_SERVICE") remarques.push(`conducteur ${conducteur.statut === "CONGE" ? "en congé" : conducteur.statut === "SUSPENDU" ? "suspendu" : "inactif"}`);
  if (departDepasse) remarques.push("départ prévu dépassé, mission non démarrée");

  return {
    cle: `mission-planifiee-${mission.idMission}`,
    libelle: `Planifiée : ${mission.motif}`,
    niveau,
    detail:
      `${nom} — du ${formatDateTime(mission.dateDebutPrevue)} au ${formatDateTime(mission.dateFinPrevue)}` +
      (remarques.length > 0 ? ` (${remarques.join(", ")})` : ""),
  };
}

/** « 2 missions planifiées » ; null quand il n'y en a aucune. */
export function resumeMissionsPlanifiees(nombre: number): string | null {
  if (nombre === 0) return null;
  return nombre === 1 ? "1 mission planifiée" : `${nombre} missions planifiées`;
}
