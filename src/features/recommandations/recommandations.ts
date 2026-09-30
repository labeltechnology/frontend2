import type { TableauExport } from "@/lib/tableau-export";
import type { DomaineRecommandation, PrioriteRecommandation, Recommandation } from "@/types/recommandation";

/**
 * Page « Recommandations » (2026-09-29, question « analyse prédictive,
 * recommandations ») : libellés, couleurs et filtres, sans React. Les règles
 * sont côté serveur (recommandation/calcul/MoteurRecommandations).
 */
export const PRIORITES: Record<PrioriteRecommandation, { libelle: string; classes: string }> = {
  HAUTE: { libelle: "Priorité haute", classes: "bg-badge-dangerBg text-badge-dangerFg" },
  MOYENNE: { libelle: "Priorité moyenne", classes: "bg-badge-warningBg text-badge-warningFg" },
  BASSE: { libelle: "Priorité basse", classes: "bg-badge-neutralBg text-badge-neutralFg" },
};

export const DOMAINES: Record<DomaineRecommandation, string> = {
  CONFORMITE: "Conformité",
  RENOUVELLEMENT: "Renouvellement",
  COUTS: "Coûts",
  UTILISATION: "Utilisation",
  CARBURANT: "Carburant",
  CONDUITE: "Conduite",
};

export interface FiltresRecommandations {
  priorite: PrioriteRecommandation | null;
  domaine: DomaineRecommandation | null;
  recherche: string;
}

export const FILTRES_DEFAUT: FiltresRecommandations = { priorite: null, domaine: null, recherche: "" };

function normaliser(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function filtrer(liste: Recommandation[], f: FiltresRecommandations): Recommandation[] {
  const q = normaliser(f.recherche.trim());
  return liste.filter(
    (r) =>
      (f.priorite === null || r.priorite === f.priorite) &&
      (f.domaine === null || r.domaine === f.domaine) &&
      (q === "" || normaliser(`${r.libelleCible} ${r.precision ?? ""} ${r.action} ${r.justification}`).includes(q)),
  );
}

export function compterParDomaine(liste: Recommandation[]): Partial<Record<DomaineRecommandation, number>> {
  const c: Partial<Record<DomaineRecommandation, number>> = {};
  for (const r of liste) c[r.domaine] = (c[r.domaine] ?? 0) + 1;
  return c;
}

/** Liste affichée → tableau Excel (plan d'action à distribuer). */
export function tableauRecommandations(liste: Recommandation[], date: string): TableauExport {
  return {
    titre: "Recommandations",
    sousTitre: `Situation au ${date.split("-").reverse().join("/")}`,
    colonnes: [
      { libelle: "Priorité", format: "TEXTE" },
      { libelle: "Domaine", format: "TEXTE" },
      { libelle: "Concerne", format: "TEXTE" },
      { libelle: "Action", format: "TEXTE" },
      { libelle: "Pourquoi", format: "TEXTE" },
      { libelle: "Suite donnée", format: "TEXTE" },
    ],
    lignes: liste.map((r) => [PRIORITES[r.priorite].libelle.replace("Priorité ", ""), DOMAINES[r.domaine],
      r.precision ? `${r.libelleCible} (${r.precision})` : r.libelleCible, r.action, r.justification, ""]),
  };
}
