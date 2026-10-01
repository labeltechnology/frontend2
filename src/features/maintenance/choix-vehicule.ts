import { filtrerVehicules } from "@/features/engins/recherche-vehicules";
import { comparerVehicules } from "@/lib/vehicule";
import { pluriel } from "@/lib/pluriel";
import type { Engin } from "@/types/engin";
import type { Maintenance } from "@/types/maintenance";

/**
 * Choix du véhicule du formulaire « Nouvelle maintenance » (2026-09-28).
 * Logique pure : véhicules proposés et avertissements.
 */

/** Hors parc : on n'y planifie plus de maintenance. */
const HORS_PARC = new Set(["REFORME", "VENDU"]);

export function vehiculesProposes(engins: readonly Engin[], recherche: string): Engin[] {
  return filtrerVehicules(
    engins.filter((e) => !HORS_PARC.has(e.statut)),
    recherche,
  ).sort(comparerVehicules);
}

export interface AvertissementVehicule {
  niveau: "info" | "attention";
  message: string;
}

/** Ce qu'il faut savoir avant de créer une maintenance sur ce véhicule. */
export function avertissementsVehicule(engin: Engin, maintenances: readonly Maintenance[]): AvertissementVehicule[] {
  const siennes = maintenances.filter((m) => m.engin?.idEngin === engin.idEngin);
  const avertissements: AvertissementVehicule[] = [];
  const enCours = siennes.filter((m) => m.statut === "EN_COURS").length;
  const planifiees = siennes.filter((m) => m.statut === "PLANIFIEE").length;
  if (enCours > 0) {
    avertissements.push({ niveau: "attention", message: `Déjà ${pluriel(enCours, "maintenance en cours", "maintenances en cours")} sur ce véhicule.` });
  }
  if (planifiees > 0) {
    avertissements.push({ niveau: "info", message: `${pluriel(planifiees, "maintenance déjà planifiée", "maintenances déjà planifiées")} : vérifiez que la maintenance à créer n'y figure pas déjà.` });
  }
  if (engin.statut === "EN_MISSION") {
    avertissements.push({ niveau: "info", message: "Véhicule en mission : la maintenance ne pourra être que planifiée." });
  }
  return avertissements;
}
