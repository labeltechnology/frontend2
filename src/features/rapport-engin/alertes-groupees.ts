import { grouperAlertes, type GroupeAlertes } from "@/features/alertes/regroupement";
import type { Alerte } from "@/types/alerte";

export { detailGroupe, libelleGroupe, type GroupeAlertes } from "@/features/alertes/regroupement";

/**
 * Alertes non traitées d'UN véhicule, regroupées par type (carte « Entretien
 * et réparation » du rapport et, par elle, mur du parc). Le regroupement
 * lui-même est commun à tout l'écran : features/alertes/regroupement.ts.
 */
export function grouperAlertesDuVehicule(alertes: readonly Alerte[], idEngin: number): GroupeAlertes[] {
  return grouperAlertes(alertes.filter((a) => !a.traitee && a.idEngin === idEngin));
}
