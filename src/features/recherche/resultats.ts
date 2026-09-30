import type { ActionRapide } from "@/features/recherche/actions-rapides";
import type { ResultatRecherche } from "@/features/recherche/types";
import type { NavItem } from "@/routes/nav-config";

/**
 * Liste unique de la fenêtre Ctrl+K (2026-09-30) : données trouvées, actions
 * rapides, puis pages. Une seule liste pour que les flèches passent d'un
 * groupe à l'autre. Logique pure, testée.
 */
export type GroupeResultat = "Véhicules" | "Conducteurs" | "Chantiers" | "Missions" | "Actions rapides" | "Pages";

export interface LigneResultat {
  cle: string;
  groupe: GroupeResultat;
  titre: string;
  detail: string | null;
  statut: string | null;
  chemin: string;
}

export const MAX_PAGES = 6;

export function assemblerResultats(
  donnees: ResultatRecherche | undefined,
  actions: readonly ActionRapide[],
  pages: readonly NavItem[],
  avecDonnees: boolean,
): LigneResultat[] {
  const lignes: LigneResultat[] = [];
  if (avecDonnees && donnees) {
    const groupes: [GroupeResultat, ResultatRecherche[keyof Omit<ResultatRecherche, "terme">]][] = [
      ["Véhicules", donnees.vehicules],
      ["Missions", donnees.missions],
      ["Chantiers", donnees.chantiers],
      ["Conducteurs", donnees.conducteurs],
    ];
    for (const [groupe, elements] of groupes) {
      for (const e of elements) {
        lignes.push({ cle: `${groupe}-${e.id}`, groupe, titre: e.titre, detail: e.detail, statut: e.statut, chemin: e.lien });
      }
    }
  }
  for (const a of actions) {
    lignes.push({ cle: `action-${a.chemin}`, groupe: "Actions rapides", titre: a.libelle, detail: null, statut: null, chemin: a.chemin });
  }
  for (const p of pages.slice(0, MAX_PAGES)) {
    lignes.push({ cle: `page-${p.to}`, groupe: "Pages", titre: p.label, detail: null, statut: null, chemin: p.to });
  }
  return lignes;
}
