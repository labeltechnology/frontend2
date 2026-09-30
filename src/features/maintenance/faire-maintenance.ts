import { porteeConcerne } from "@/features/referentiels-fiche/libelles";
import { peut, ROLES_PAR_CAPACITE } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";
import type { CategorieEngin } from "@/types/engin";
import type { CreerMaintenanceRequest, TypeMaintenance } from "@/types/maintenance";
import type { TravailMaintenance } from "@/types/travail-maintenance";

/**
 * Logique pure de la boîte « Faire la maintenance » (2026-09-25), sans
 * React : testable seule, et réutilisable si la boîte est ouverte ailleurs
 * que depuis le rapport véhicule.
 */

/** Rôles autorisés à créer / démarrer une maintenance — MaintenanceController (Droits.GERER_MAINTENANCE). Source : lib/droits.ts. */
export const ROLES_MAINTENANCE = ROLES_PAR_CAPACITE.GERER_MAINTENANCE;

export function peutFaireMaintenance(role: RoleLibelle | undefined): boolean {
  return peut(role, "GERER_MAINTENANCE");
}

/** Travaux proposés pour un engin : actifs et applicables à sa catégorie (même règle que le backend), dans l'ordre du référentiel. */
export function travauxProposes(
  travaux: readonly TravailMaintenance[],
  categorie: CategorieEngin | undefined,
): TravailMaintenance[] {
  return travaux
    .filter((t) => t.actif && porteeConcerne(t.portee, categorie))
    .sort((a, b) => a.ordre - b.ordre || a.libelle.localeCompare(b.libelle, "fr"));
}

/** Coche / décoche un travail (l'ordre de sélection est conservé). */
export function basculerTravail(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
}

/**
 * Type proposé d'après les travaux cochés : corrective dès qu'un travail
 * correctif est choisi (réparation), préventive sinon.
 */
export function typeSuggere(ids: readonly number[], travaux: readonly TravailMaintenance[]): TypeMaintenance {
  const choisis = travaux.filter((t) => ids.includes(t.idTravailMaintenance));
  return choisis.some((t) => t.typeMaintenance === "CORRECTIVE") ? "CORRECTIVE" : "PREVENTIVE";
}

export type MomentMaintenance = "MAINTENANT" | "PLANIFIER";

export interface SaisieFaireMaintenance {
  idsTravaux: number[];
  type: TypeMaintenance;
  description: string;
  idGarageExterne: number | null;
  idPosteEntretien: number | null;
  /** Date prévue « AAAA-MM-JJTHH:mm » (planification, 2026-09-28) ; null ou absent = sans date. */
  datePrevue?: string | null;
}

/** Il faut au moins un travail coché ou une description : une maintenance vide n'a pas de sens. */
export function saisieSuffisante(saisie: Pick<SaisieFaireMaintenance, "idsTravaux" | "description">): boolean {
  return saisie.idsTravaux.length > 0 || saisie.description.trim().length > 0;
}

export function requeteFaireMaintenance(idEngin: number, saisie: SaisieFaireMaintenance): CreerMaintenanceRequest {
  const description = saisie.description.trim();
  return {
    idEngin,
    type: saisie.type,
    description: description || undefined,
    idGarageExterne: saisie.idGarageExterne ?? undefined,
    idPosteEntretien: saisie.idPosteEntretien ?? undefined,
    idsTravaux: saisie.idsTravaux.length > 0 ? [...saisie.idsTravaux] : undefined,
    datePrevue: saisie.datePrevue || undefined,
  };
}
