import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import type { Affectation } from "@/types/affectation";
import type { Alerte } from "@/types/alerte";
import type { Carburant } from "@/types/carburant";
import type { AffectationChantier } from "@/types/chantier";
import type { Document } from "@/types/document";
import type { ControleBordHistorique } from "@/types/historique-engin";
import type { Incident } from "@/types/incident";
import type { Maintenance } from "@/types/maintenance";
import type { Mission } from "@/types/mission";

/**
 * Sélections et tris de la page « Historique du véhicule » (2026-09-25).
 * Fonctions pures, sans React : chaque onglet filtre des listes déjà
 * exposées par le backend sur le véhicule affiché, du plus récent au plus
 * ancien.
 */

/** Tri décroissant sur une date ISO (« yyyy-MM-dd » ou date-heure) ; sans date = en tête (en cours / à planifier). */
function parDateDecroissante<T>(date: (element: T) => string | null | undefined) {
  return (a: T, b: T) => {
    const da = date(a) ?? "9999";
    const db = date(b) ?? "9999";
    return db.localeCompare(da);
  };
}

/** Toutes les alertes du véhicule, traitées ou non. */
export function alertesDuVehicule(alertes: Alerte[], idEngin: number): Alerte[] {
  return alertes.filter((a) => a.idEngin === idEngin).sort(parDateDecroissante((a) => a.dateCreation));
}

/** Toutes les maintenances du véhicule ; les planifiées sans date d'abord, puis de la plus récente à la plus ancienne. */
export function maintenancesDuVehicule(maintenances: Maintenance[], idEngin: number): Maintenance[] {
  return maintenances.filter((m) => m.engin?.idEngin === idEngin).sort(parDateDecroissante((m) => m.dateDebut));
}

/**
 * Tous les documents du véhicule, versions remplacées comprises (le permis,
 * qui appartient au conducteur, est exclu) : rangés par type, puis de la
 * version la plus récente à la plus ancienne.
 */
export function documentsDuVehicule(documents: Document[], idEngin: number): Document[] {
  return documents
    .filter((d) => d.engin?.idEngin === idEngin && d.type !== "PERMIS_CONDUIRE")
    .sort(
      (a, b) =>
        LIBELLES_TYPE_DOCUMENT[a.type].localeCompare(LIBELLES_TYPE_DOCUMENT[b.type], "fr") ||
        b.version - a.version ||
        b.idDocument - a.idDocument,
    );
}

/** Tous les rattachements du véhicule à un chantier (actifs, terminés, annulés), par période décroissante. */
export function rattachementsDuVehicule(rattachements: AffectationChantier[], idEngin: number): AffectationChantier[] {
  return rattachements
    .filter((r) => r.engin.idEngin === idEngin)
    .sort(parDateDecroissante((r) => r.dateDebutPrevue));
}

/** Toutes les missions du véhicule (toutes situations), de la plus récente à la plus ancienne. */
export function missionsDuVehicule(missions: Mission[], idEngin: number): Mission[] {
  return missions.filter((m) => m.engin.idEngin === idEngin).sort(parDateDecroissante((m) => m.dateDebutPrevue));
}

/** Toutes les affectations conducteur ↔ véhicule, de la plus récente à la plus ancienne. */
export function affectationsDuVehicule(affectations: Affectation[], idEngin: number): Affectation[] {
  return affectations.filter((a) => a.engin.idEngin === idEngin).sort(parDateDecroissante((a) => a.dateDebut));
}

/** Tous les pleins du véhicule, du plus récent au plus ancien (2026-09-25). */
export function pleinsDuVehicule(pleins: Carburant[], idEngin: number): Carburant[] {
  return pleins.filter((p) => p.engin.idEngin === idEngin).sort(parDateDecroissante((p) => p.dateHeure));
}

/** Tous les incidents du véhicule (ouverts et clôturés), du plus récent au plus ancien (2026-09-25). */
export function incidentsDuVehicule(incidents: Incident[], idEngin: number): Incident[] {
  return incidents.filter((i) => i.engin.idEngin === idEngin).sort(parDateDecroissante((i) => i.dateSurvenue));
}

export interface ControleGroupe {
  dateControle: string;
  controles: ControleBordHistorique[];
}

/**
 * Contrôles de bord regroupés par date de contrôle (un contrôle de la fiche
 * = une date), du plus récent au plus ancien ; dans chaque contrôle, les
 * absents d'abord puis l'ordre de saisie.
 */
export function grouperControlesParDate(controles: ControleBordHistorique[]): ControleGroupe[] {
  const groupes = new Map<string, ControleBordHistorique[]>();
  for (const c of controles) {
    const liste = groupes.get(c.dateControle) ?? [];
    liste.push(c);
    groupes.set(c.dateControle, liste);
  }
  return [...groupes.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateControle, liste]) => ({
      dateControle,
      controles: [...liste].sort((a, b) => Number(a.present) - Number(b.present)),
    }));
}
