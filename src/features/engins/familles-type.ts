import type { CategorieEngin, TypeEngin } from "@/types/engin";

/**
 * Familles de matériel (2026-10-01, V67) : niveau entre la catégorie et le
 * type (« Véhicule de service » → 4x4, léger, bus ; « Camion » → benne,
 * citerne). Saisie libre dans la page Types d'engin, avec des propositions.
 * Logique pure, testée.
 */

/** Libellé des types sans famille renseignée. */
export const SANS_FAMILLE = "Autres";

/** Propositions de départ, par catégorie (l'utilisateur peut en saisir d'autres). */
export const FAMILLES_PROPOSEES: Record<CategorieEngin, readonly string[]> = {
  VEHICULE_ROUTIER: ["Véhicule de service", "Véhicule utilitaire", "Camion", "Transport de personnel"],
  ENGIN_CHANTIER: ["Engin de terrassement", "Engin de compactage", "Engin de levage", "Engin de manutention"],
};

/** Même règle que le serveur (FamilleType) : espaces réduits, première lettre en majuscule ; vide → null. */
export function normaliserFamille(brute: string | null | undefined): string | null {
  if (!brute) return null;
  const propre = brute.replace(/\s+/g, " ").trim().slice(0, 60).trim();
  if (!propre) return null;
  return propre.charAt(0).toUpperCase() + propre.slice(1);
}

/** Familles à proposer pour une catégorie : celles déjà utilisées d'abord, puis les propositions, sans doublon. */
export function famillesAProposer(types: TypeEngin[] | undefined, categorie: CategorieEngin): string[] {
  const vues = new Map<string, string>();
  const ajouter = (f: string | null | undefined) => {
    const n = normaliserFamille(f);
    if (n && !vues.has(n.toLocaleLowerCase("fr"))) vues.set(n.toLocaleLowerCase("fr"), n);
  };
  (types ?? []).filter((t) => t.categorie === categorie).forEach((t) => ajouter(t.famille));
  FAMILLES_PROPOSEES[categorie].forEach(ajouter);
  return [...vues.values()];
}
