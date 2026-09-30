import { ROLES } from "@/lib/droits";
import type { RoleLibelle } from "@/types/auth";

/**
 * Pages par métier (2026-09-30) — qui voit quelle page du menu. Logique pure,
 * sans icônes ni React (utilisée par nav-config, l'aide et les tests).
 *
 * - Direction (DG, responsable du parc, administrateur) : tout.
 * - Assistant parc : parc, exploitation, chantiers, rapports.
 * - Chef maintenance : atelier, véhicules, incidents, alertes de l'atelier,
 *   fiabilité ; assistant maintenance : pareil sans fiabilité.
 * - Comptable : finances, coûts, renouvellement, rapports, carburant, atelier.
 * - Chef de chantier : ses chantiers, affectations, GPS, incidents, alertes.
 * - Conducteur : messagerie et aide (le reste dans l'application mobile).
 *
 * Le serveur protège les données avec les capacités de lib/droits.ts
 * (miroir de Droits.java) : une page n'est donnée qu'aux rôles qui peuvent
 * en lire les données.
 */

type Roles = readonly RoleLibelle[];

const DIRECTION: Roles = ["DG", "RESPONSABLE_PARC", "ADMINISTRATEUR"];
const avec = (...autres: RoleLibelle[]): Roles => [...DIRECTION, ...autres];

export const ROLES_SITE: Roles = ROLES.filter((r) => r !== "CONDUCTEUR");

/** Rôles par page ; `undefined` = tous les rôles (messagerie, aide). */
export const ACCES_PAGES: Record<string, Roles | undefined> = {
  // Pilotage
  "/": ROLES_SITE,
  "/analytique": DIRECTION,
  "/performance": DIRECTION,
  "/couts": avec("COMPTABLE"),
  "/fiabilite": avec("CHEF_MAINTENANCE"),
  "/renouvellement": avec("COMPTABLE"),
  "/recommandations": DIRECTION,
  "/rapports": avec("ASSISTANT_PARC", "COMPTABLE"),
  "/messagerie": undefined,
  // Parc
  "/engins": avec("ASSISTANT_PARC", "CHEF_MAINTENANCE", "ASSISTANT_MAINTENANCE"),
  "/types-engin": DIRECTION,
  "/listes-fiche": DIRECTION,
  "/documents": avec("ASSISTANT_PARC"),
  "/conducteurs": avec("ASSISTANT_PARC"),
  "/zones": avec("ASSISTANT_PARC"),
  // Exploitation
  "/missions": avec("ASSISTANT_PARC"),
  "/affectations": avec("ASSISTANT_PARC", "CHEF_CHANTIER"),
  "/chantiers": avec("ASSISTANT_PARC", "CHEF_CHANTIER"),
  "/gps": avec("ASSISTANT_PARC", "CHEF_CHANTIER"),
  "/carburant": avec("ASSISTANT_PARC", "COMPTABLE"),
  "/incidents": avec("ASSISTANT_PARC", "CHEF_MAINTENANCE", "ASSISTANT_MAINTENANCE", "CHEF_CHANTIER"),
  "/alertes": avec("ASSISTANT_PARC", "CHEF_MAINTENANCE", "ASSISTANT_MAINTENANCE", "CHEF_CHANTIER"),
  // Atelier
  "/maintenance": avec("CHEF_MAINTENANCE", "ASSISTANT_MAINTENANCE", "COMPTABLE"),
  "/garages-externes": avec("CHEF_MAINTENANCE", "ASSISTANT_MAINTENANCE", "COMPTABLE"),
  "/fournisseurs": avec("CHEF_MAINTENANCE", "ASSISTANT_MAINTENANCE", "COMPTABLE"),
  // Finances
  "/locations-externes": avec("COMPTABLE"),
  "/locations-entrantes": avec("COMPTABLE"),
  "/prestataires-location": avec("COMPTABLE"),
  "/factures-proforma": avec("COMPTABLE"),
  "/export-comptable": avec("COMPTABLE"),
  // Administration
  "/mise-en-service": DIRECTION,
  "/utilisateurs": DIRECTION,
  "/journal-audit": DIRECTION,
  "/suivi-logiciel": DIRECTION,
  "/imports": DIRECTION,
  "/aide": undefined,
  "/parametres": DIRECTION,
};

/** Entrée de ACCES_PAGES d'un chemin : le plus long préfixe (« /engins/12/rapport » → « /engins »). */
export function pageDuChemin(chemin: string): string | undefined {
  const propre = chemin.split(/[?#]/)[0] || "/";
  return Object.keys(ACCES_PAGES)
    .filter((p) => (p === "/" ? propre === "/" : propre === p || propre.startsWith(`${p}/`)))
    .sort((a, b) => b.length - a.length)[0];
}

/** Le rôle peut-il ouvrir ce chemin ? Chemin hors menu (accès refusé, 404…) : oui. */
export function pageVisible(role: RoleLibelle | undefined, chemin: string): boolean {
  const page = pageDuChemin(chemin);
  if (page === undefined) return true;
  const roles = ACCES_PAGES[page];
  return roles === undefined || (role !== undefined && roles.includes(role));
}

/** Page d'arrivée : le tableau de bord, sinon la première page permise (conducteur : messagerie). */
export function pageAccueil(role: RoleLibelle | undefined): string {
  return Object.keys(ACCES_PAGES).find((p) => pageVisible(role, p)) ?? "/aide";
}
