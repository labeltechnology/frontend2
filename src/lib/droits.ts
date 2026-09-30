import type { RoleLibelle } from "@/types/auth";

/**
 * Niveaux d'autorisation (2026-09-28) — point unique des droits côté écran.
 *
 * Miroir de `backend/.../security/Droits.java` : mêmes capacités, mêmes
 * rôles. Le serveur fait foi (@PreAuthorize) ; ici, on n'affiche que les
 * menus et les boutons que le rôle connecté peut réellement utiliser.
 * Changer un droit = changer Droits.java ET ce fichier.
 */

export type Capacite =
  /** Tout le métier : véhicules, missions, chantiers, locations, documents… */
  | "GERER_PARC"
  /** Activité maintenance : maintenances, pièces, garages, entretien, équipements de bord. */
  | "GERER_MAINTENANCE"
  /** Plein, incident, kilométrage, démarrer / terminer une mission (conducteur : son véhicule). */
  | "SAISIE_TERRAIN"
  /** Lecture des données de gestion protégées : conducteurs, factures, rapports, proformas. */
  | "CONSULTER_GESTION"
  /** Comptes utilisateurs, paramètres, journal d'audit. */
  | "ADMINISTRER"
  /** Demander du matériel pour un chantier (V64 ; chef de chantier : ses chantiers). */
  | "DEMANDER_MATERIEL"
  /** Suivi d'un chantier : terrain, journal, incidents, demandes (V64 ; chef de chantier : ses chantiers). */
  | "SUIVI_CHANTIER"
  /** Écrire le journal de chantier (V64 ; chef de chantier : ses chantiers). */
  | "ECRIRE_JOURNAL_CHANTIER"
  /** Tableau de bord de direction : KPI, alertes chiffrées, flotte, coûts face au budget (2026-09-30). */
  | "PILOTAGE_DIRECTION";

export const ROLES_PAR_CAPACITE: Record<Capacite, readonly RoleLibelle[]> = {
  GERER_PARC: ["DG", "RESPONSABLE_PARC"],
  GERER_MAINTENANCE: ["DG", "RESPONSABLE_PARC", "CHEF_MAINTENANCE"],
  SAISIE_TERRAIN: ["DG", "RESPONSABLE_PARC", "CONDUCTEUR"],
  CONSULTER_GESTION: [
    "DG",
    "RESPONSABLE_PARC",
    "ASSISTANT_PARC",
    "CHEF_MAINTENANCE",
    "ASSISTANT_MAINTENANCE",
    "ADMINISTRATEUR",
    "COMPTABLE",
  ],
  ADMINISTRER: ["ADMINISTRATEUR", "DG", "RESPONSABLE_PARC"],
  DEMANDER_MATERIEL: ["DG", "RESPONSABLE_PARC", "ASSISTANT_PARC", "CHEF_CHANTIER"],
  SUIVI_CHANTIER: [
    "DG",
    "RESPONSABLE_PARC",
    "ASSISTANT_PARC",
    "CHEF_MAINTENANCE",
    "ASSISTANT_MAINTENANCE",
    "ADMINISTRATEUR",
    "COMPTABLE",
    "CHEF_CHANTIER",
  ],
  ECRIRE_JOURNAL_CHANTIER: ["DG", "RESPONSABLE_PARC", "CHEF_CHANTIER"],
  PILOTAGE_DIRECTION: ["DG", "RESPONSABLE_PARC"],
};

/** Le rôle connecté a-t-il cette capacité ? (sans session : non) */
export function peut(role: RoleLibelle | undefined, capacite: Capacite): boolean {
  return role !== undefined && ROLES_PAR_CAPACITE[capacite].includes(role);
}

/** Tous les rôles, dans l'ordre d'affichage (liste des comptes, formulaire). */
export const ROLES: readonly RoleLibelle[] = [
  "DG",
  "RESPONSABLE_PARC",
  "ASSISTANT_PARC",
  "CHEF_MAINTENANCE",
  "ASSISTANT_MAINTENANCE",
  "CONDUCTEUR",
  "ADMINISTRATEUR",
  "COMPTABLE",
  "CHEF_CHANTIER",
];

export const LIBELLES_ROLE: Record<RoleLibelle, string> = {
  DG: "Directeur général",
  RESPONSABLE_PARC: "Responsable du parc",
  ASSISTANT_PARC: "Assistant du responsable",
  CHEF_MAINTENANCE: "Chef de maintenance",
  ASSISTANT_MAINTENANCE: "Assistant maintenance",
  CONDUCTEUR: "Conducteur",
  ADMINISTRATEUR: "Administrateur (informatique)",
  COMPTABLE: "Comptable",
  CHEF_CHANTIER: "Chef de chantier",
};

/** Libellé lisible d'un rôle ; rôle inconnu (ancien jeton, donnée imprévue) affiché tel quel. */
export function libelleRole(role: string | undefined | null): string {
  if (!role) return "—";
  return (LIBELLES_ROLE as Record<string, string>)[role] ?? role;
}

/**
 * Rôles sensibles : seuls un DG ou un administrateur peuvent les attribuer ou
 * toucher un compte qui les porte (miroir de UtilisateurService#verifierDroitSurRole).
 */
export const ROLES_SENSIBLES: readonly RoleLibelle[] = ["DG", "ADMINISTRATEUR"];

/** Rôles que le connecté peut attribuer dans le formulaire utilisateur. */
export function rolesAttribuables(roleConnecte: RoleLibelle | undefined): RoleLibelle[] {
  const toutPermis = roleConnecte !== undefined && ROLES_SENSIBLES.includes(roleConnecte);
  return ROLES.filter((r) => toutPermis || !ROLES_SENSIBLES.includes(r));
}
