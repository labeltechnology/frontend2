import { peut, ROLES_PAR_CAPACITE } from "@/lib/droits";
import { formatDate } from "@/lib/utils";
import type { RoleLibelle } from "@/types/auth";
import type { AffectationChantier, Chantier } from "@/types/chantier";
import type { Mission } from "@/types/mission";

/**
 * Occupations d'un véhicule — missions et périodes sur un chantier — et
 * règles du formulaire « Mission ou chantier » de la carte « Emplacement du
 * jour » (2026-09-25). Fonctions pures. Les dates se comparent au JOUR,
 * bornes incluses, comme côté serveur (OccupationEngin,
 * DisponibiliteEnginChantier) — le serveur reste celui qui fait foi.
 */

/** Rôles autorisés à créer une mission ou un rattachement de chantier (Droits.GERER_PARC). Source : lib/droits.ts. */
export const ROLES_PLANIFICATION = ROLES_PAR_CAPACITE.GERER_PARC;

export function peutPlanifierEmplacement(role: RoleLibelle | undefined): boolean {
  return peut(role, "GERER_PARC");
}

export interface Occupation {
  type: "mission" | "chantier";
  cle: string;
  libelle: string;
  /** « yyyy-MM-dd » */
  debut: string;
  fin: string;
}

/** « 2026-01-20T08:00:00 » → « 2026-01-20 ». */
export function jourDe(dateOuDateHeure: string): string {
  return dateOuDateHeure.slice(0, 10);
}

/** Missions planifiées ou en cours, et rattachements actifs sur un chantier non clos, du véhicule. */
export function occupationsDuVehicule(
  idEngin: number,
  missions: readonly Mission[],
  rattachements: readonly AffectationChantier[],
): Occupation[] {
  const deMissions = missions
    .filter((m) => m.engin.idEngin === idEngin && (m.statut === "PLANIFIEE" || m.statut === "EN_COURS"))
    .map<Occupation>((m) => ({
      type: "mission",
      cle: `mission-${m.idMission}`,
      libelle: m.motif,
      debut: jourDe(m.dateDebutPrevue),
      fin: jourDe(m.dateFinPrevue),
    }));
  const deChantiers = rattachements
    .filter(
      (r) =>
        r.engin.idEngin === idEngin &&
        r.statut === "ACTIVE" &&
        r.chantier.statut !== "TERMINE" &&
        r.chantier.statut !== "ANNULE",
    )
    .map<Occupation>((r) => ({
      type: "chantier",
      cle: `chantier-${r.idAffectationChantier}`,
      libelle: r.chantier.nom,
      debut: jourDe(r.dateDebutPrevue),
      fin: jourDe(r.dateFinPrevue),
    }));
  return [...deMissions, ...deChantiers].sort((a, b) => a.debut.localeCompare(b.debut));
}

/** Première occupation qui chevauche [debut, fin] (jours « yyyy-MM-dd », bornes incluses). */
export function chevauchement(occupations: readonly Occupation[], debut: string, fin: string): Occupation | undefined {
  return occupations.find((o) => o.debut <= fin && debut <= o.fin);
}

export function messageConflit(o: Occupation): string {
  const periode = `du ${formatDate(o.debut)} au ${formatDate(o.fin)}`;
  return o.type === "mission"
    ? `Le véhicule est déjà en mission « ${o.libelle} » ${periode}.`
    : `Le véhicule est déjà prévu sur le chantier « ${o.libelle} » ${periode}.`;
}

// --- Mission -------------------------------------------------------------------

/**
 * Contrôles d'une mission avant envoi (« yyyy-MM-ddTHH:mm ») : la fin après
 * le début et dans le futur (règle du serveur), puis — règle demandée le
 * 2026-09-25 — aucune période du véhicule sur un chantier. Les missions
 * entre elles ne sont pas comparées ici : le serveur ne le fait pas non
 * plus pour un même véhicule.
 */
export function erreurMission(
  debut: string,
  fin: string,
  maintenant: string,
  occupations: readonly Occupation[],
): string | null {
  if (!debut || !fin) return "Indiquez le début et la fin de la mission.";
  if (fin <= debut) return "La fin doit être après le début.";
  if (fin <= maintenant) return "La fin de la mission doit être dans le futur.";
  const conflit = chevauchement(
    occupations.filter((o) => o.type === "chantier"),
    jourDe(debut),
    jourDe(fin),
  );
  return conflit ? messageConflit(conflit) : null;
}

// --- Chantier ------------------------------------------------------------------

/**
 * Chantiers où l'on peut encore prévoir le véhicule : planifiés ou en cours,
 * pas encore finis, et où il n'est pas déjà rattaché (un seul rattachement
 * actif par chantier) ; par date de début.
 */
export function chantiersProposes(
  chantiers: readonly Chantier[],
  aujourdhui: string,
  idsDejaRattaches: ReadonlySet<number>,
): Chantier[] {
  return chantiersEnCours(chantiers, aujourdhui)
    .filter((c) => !idsDejaRattaches.has(c.idChantier))
    .sort((a, b) => a.dateDebutPrevue.localeCompare(b.dateDebutPrevue));
}

/**
 * Chantiers encore ouverts (planifiés ou en cours, pas encore finis), SANS
 * tenir compte des rattachements du véhicule. Sert à expliquer une liste vide :
 * « aucun chantier ouvert » et « véhicule déjà rattaché à tous » sont deux
 * situations différentes, et les confondre laisse croire à une panne (voir
 * FormulaireChantier.tsx).
 */
export function chantiersEnCours(chantiers: readonly Chantier[], aujourdhui: string): Chantier[] {
  return chantiers.filter(
    (c) => (c.statut === "PLANIFIE" || c.statut === "EN_COURS") && jourDe(c.dateFinPrevue) >= aujourdhui,
  );
}

/** Période proposée à la sélection d'un chantier : ses dates, sans remonter avant aujourd'hui. */
export function periodeParDefaut(chantier: Chantier, aujourdhui: string): { debut: string; fin: string } {
  const debutChantier = jourDe(chantier.dateDebutPrevue);
  return { debut: debutChantier > aujourdhui ? debutChantier : aujourdhui, fin: jourDe(chantier.dateFinPrevue) };
}

/**
 * Contrôles d'une période de chantier (« yyyy-MM-dd ») : comprise dans les
 * dates du chantier, puis aucun chevauchement avec une autre période de
 * chantier ni une mission du véhicule (règles du serveur).
 */
export function erreurChantier(
  chantier: Chantier | undefined,
  debut: string,
  fin: string,
  occupations: readonly Occupation[],
): string | null {
  if (!chantier) return "Choisissez un chantier.";
  if (!debut || !fin) return "Indiquez le début et la fin.";
  if (fin < debut) return "La fin doit être le même jour ou après le début.";
  const debutChantier = jourDe(chantier.dateDebutPrevue);
  const finChantier = jourDe(chantier.dateFinPrevue);
  if (debut < debutChantier || fin > finChantier) {
    return `La période doit rester dans les dates du chantier (du ${formatDate(debutChantier)} au ${formatDate(finChantier)}).`;
  }
  const conflit = chevauchement(occupations, debut, fin);
  return conflit ? messageConflit(conflit) : null;
}
