import { GROUPES_NAV, type NavItem } from "@/routes/nav-config";

/**
 * Recherche d'une page du menu (loupe de la barre de navigation, 2026-09-25).
 * Logique pure, testable seule : insensible à la casse et aux accents
 * (« vehicule » trouve « Véhicules »), sur le libellé de la page et celui de
 * son groupe. Les pages dont le libellé COMMENCE par le terme passent en tête.
 * La liste reçue est déjà filtrée par rôle (entreesVisibles) : la recherche
 * ne propose jamais une page interdite.
 */
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const LIBELLE_GROUPE = new Map<string, string>(GROUPES_NAV.map((g) => [g.id, g.libelle]));

export function libelleGroupe(item: NavItem): string {
  return LIBELLE_GROUPE.get(item.groupe) ?? "";
}

export function rechercherPages(items: readonly NavItem[], terme: string): NavItem[] {
  const t = normaliser(terme);
  if (!t) return [...items];
  const rang = (item: NavItem): number => {
    const libelle = normaliser(item.label);
    if (libelle.startsWith(t)) return 0;
    if (libelle.includes(t)) return 1;
    if (normaliser(libelleGroupe(item)).includes(t)) return 2;
    return -1;
  };
  return items
    .map((item, index) => ({ item, index, rang: rang(item) }))
    .filter((r) => r.rang >= 0)
    .sort((a, b) => a.rang - b.rang || a.index - b.index)
    .map((r) => r.item);
}
