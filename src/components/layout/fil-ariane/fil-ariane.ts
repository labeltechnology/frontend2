import { GROUPES_NAV, type NavItem } from "@/routes/nav-config";
import { entreeDuChemin } from "@/routes/navigation-groupes";

/**
 * Fil d'Ariane (2026-09-30) : « Parc › Véhicules › 1234 TBA — Toyota Hilux ›
 * Fiche ». Logique pure, testée : le groupe (sans lien), la page du menu
 * (lien vers la liste, qui retrouve ses filtres), puis le détail.
 */
export interface SegmentAriane {
  libelle: string;
  chemin?: string;
}

const SUFFIXES: Record<string, string> = {
  nouveau: "Nouveau",
  fiche: "Fiche",
  rapport: "Rapport",
  historique: "Historique",
  plan: "Plan",
};

export function segmentsAriane(pathname: string, items: readonly NavItem[], detail?: string | null): SegmentAriane[] {
  const entree = entreeDuChemin(pathname, items);
  if (!entree || entree.to === "/") return [];
  const groupe = GROUPES_NAV.find((g) => g.id === entree.groupe);
  const segments: SegmentAriane[] = groupe ? [{ libelle: groupe.libelle }] : [];
  if (pathname === entree.to) {
    segments.push({ libelle: entree.label });
    return segments;
  }
  segments.push({ libelle: entree.label, chemin: entree.to });
  const reste = pathname.slice(entree.to.length).split("/").filter(Boolean);
  const dernier = reste[reste.length - 1];
  if (detail) segments.push({ libelle: detail });
  const suffixe = dernier ? SUFFIXES[dernier] : undefined;
  if (suffixe && !(suffixe === "Nouveau" && detail)) segments.push({ libelle: suffixe });
  if (!detail && !suffixe) segments.push({ libelle: "Détail" });
  return segments;
}

/** Page de liste à laquelle revenir depuis un détail ; null sur une page du menu. */
export function cheminRetour(pathname: string, items: readonly NavItem[]): { chemin: string; libelle: string } | null {
  const entree = entreeDuChemin(pathname, items);
  if (!entree || entree.to === "/" || pathname === entree.to) return null;
  return { chemin: entree.to, libelle: entree.label };
}
