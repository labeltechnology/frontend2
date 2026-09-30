import { normaliserNombre } from "@/lib/utils";
import type {
  OrganisationChantier,
  OrganisationChantierRequest,
  PrioriteChantier,
} from "@/types/chantier";

/**
 * Organisation d'un chantier (V64, 2026-09-29) — logique pure : libellés de
 * priorité, valeurs par défaut, contrôle et corps envoyé avec la fiche.
 * Le serveur (OrganisationChantierService) reste l'arbitre.
 */

export const LIBELLES_PRIORITE: Record<PrioriteChantier, string> = {
  NORMALE: "Normale",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
};

export const VARIANT_PRIORITE: Record<PrioriteChantier, "secondary" | "warning" | "destructive"> = {
  NORMALE: "secondary",
  HAUTE: "warning",
  CRITIQUE: "destructive",
};

export const RAYON_PRESENCE_DEFAUT = 300;

/** Formulaire de l'organisation (texte pour les champs numériques saisis). */
export interface OrganisationSaisie {
  idTypeChantier: number | null;
  priorite: PrioriteChantier;
  idResponsable: number | null;
  rayon: string;
  budget: string;
  clientNom: string;
  clientContact: string;
}

export function organisationParDefaut(): OrganisationSaisie {
  return { idTypeChantier: null, priorite: "NORMALE", idResponsable: null, rayon: "", budget: "", clientNom: "", clientContact: "" };
}

export function saisieDepuis(o: OrganisationChantier | undefined | null): OrganisationSaisie {
  if (!o) return organisationParDefaut();
  return {
    idTypeChantier: o.idTypeChantier,
    priorite: o.priorite,
    idResponsable: o.idResponsable,
    rayon: o.rayonPresenceMetres == null ? "" : String(o.rayonPresenceMetres),
    budget: o.budgetMateriel == null ? "" : String(o.budgetMateriel),
    clientNom: o.clientNom ?? "",
    clientContact: o.clientContact ?? "",
  };
}

function nombre(texte: string): number | null {
  const propre = normaliserNombre(texte);
  if (!propre) return null;
  const n = Number(propre);
  return Number.isFinite(n) ? n : Number.NaN;
}

/** Problème de saisie (affiché en rouge) ; null si l'organisation est valide. */
export function problemeOrganisation(s: OrganisationSaisie): string | null {
  const rayon = nombre(s.rayon);
  if (rayon !== null && (Number.isNaN(rayon) || !Number.isInteger(rayon) || rayon < 50 || rayon > 5000)) {
    return "Le rayon de présence va de 50 à 5 000 m.";
  }
  const budget = nombre(s.budget);
  if (budget !== null && (Number.isNaN(budget) || budget < 0)) return "Le budget matériel doit être un montant positif.";
  if (s.clientNom.trim().length > 150) return "Nom du client : 150 caractères au plus.";
  if (s.clientContact.trim().length > 255) return "Contact du client : 255 caractères au plus.";
  return null;
}

/** Corps envoyé avec la fiche (appeler seulement si problemeOrganisation renvoie null). */
export function requeteOrganisation(s: OrganisationSaisie): OrganisationChantierRequest {
  return {
    idTypeChantier: s.idTypeChantier,
    priorite: s.priorite,
    idResponsable: s.idResponsable,
    rayonPresenceMetres: nombre(s.rayon),
    budgetMateriel: nombre(s.budget),
    clientNom: s.clientNom.trim() || null,
    clientContact: s.clientContact.trim() || null,
  };
}

/** Le connecté est-il le responsable désigné du chantier ? */
export function estResponsable(o: { idResponsable?: number | null } | undefined | null, idUtilisateur: number | undefined): boolean {
  return idUtilisateur !== undefined && o?.idResponsable != null && o.idResponsable === idUtilisateur;
}
