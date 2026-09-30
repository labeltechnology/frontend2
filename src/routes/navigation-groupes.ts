import type { RoleLibelle } from "@/types/auth";
import { GROUPES_NAV, type GroupeNav, type IdGroupeNav, type NavItem } from "@/routes/nav-config";

/**
 * Logique pure de la barre latérale groupée (sans React, testable seule) :
 * filtrage par rôle, regroupement dans l'ordre de GROUPES_NAV, et groupe de
 * la page courante (qui doit rester ouvert).
 */

export interface SectionNavigation {
  groupe: GroupeNav;
  items: NavItem[];
}

/** Entrées visibles pour le rôle connecté (sans rôle : seulement les entrées ouvertes à tous). */
export function entreesVisibles(items: readonly NavItem[], role: RoleLibelle | undefined): NavItem[] {
  return items.filter((item) => !item.rolesAutorises || (role !== undefined && item.rolesAutorises.includes(role)));
}

/** Sections dans l'ordre de GROUPES_NAV ; l'ordre des entrées de NAV_ITEMS est conservé ; les groupes vides disparaissent. */
export function grouperNavigation(items: readonly NavItem[]): SectionNavigation[] {
  return GROUPES_NAV.map((groupe) => ({ groupe, items: items.filter((item) => item.groupe === groupe.id) })).filter(
    (section) => section.items.length > 0,
  );
}

/**
 * Entrée de menu de la page courante : le plus long préfixe de chemin
 * (« /engins/12/rapport » → « /engins »). « / » ne correspond qu'à lui-même,
 * et « /engins-x » ne correspond pas à « /engins ».
 */
export function entreeDuChemin(pathname: string, items: readonly NavItem[]): NavItem | undefined {
  return items
    .filter((item) =>
      item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`),
    )
    .sort((a, b) => b.to.length - a.to.length)[0];
}

/** Groupe de la page courante, ou undefined (page hors menu : aide, accès refusé…). */
export function groupeDuChemin(pathname: string, items: readonly NavItem[]): IdGroupeNav | undefined {
  return entreeDuChemin(pathname, items)?.groupe;
}
