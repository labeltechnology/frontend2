import { LIBELLES_CATEGORIE } from "@/features/engins/filtre-url";
import { normaliserFamille, SANS_FAMILLE } from "@/features/engins/familles-type";
import type { CategorieEngin } from "@/types/engin";
import type { RepartitionFlotte, TypeFlotte } from "@/types/pilotage";

/**
 * « État de la flotte » détaillé (2026-10-01, demande de la direction) :
 * catégorie → famille → type (« Véhicule de service » → 4x4, léger, bus ;
 * « Camion » → benne, citerne). Sous-totaux additionnés ; utilisation et
 * usage par jour des regroupements = moyennes des types pondérées par leur
 * nombre de véhicules. Logique pure, testée.
 */

export interface GroupeFlotte {
  famille: string | null;
  libelle: string;
  repartition: RepartitionFlotte;
  tauxUtilisation: number | null;
  usageParJour: number | null;
  uniteUsage: string | null;
  types: TypeFlotte[];
}

export interface CategorieFlotte {
  categorie: CategorieEngin;
  libelle: string;
  repartition: RepartitionFlotte;
  tauxUtilisation: number | null;
  usageParJour: number | null;
  uniteUsage: string | null;
  familles: GroupeFlotte[];
  /** Vrai si au moins un type a une famille : l'écran affiche alors le niveau famille. */
  avecFamilles: boolean;
}

const ORDRE: CategorieEngin[] = ["VEHICULE_ROUTIER", "ENGIN_CHANTIER"];
const VIDE: RepartitionFlotte = { total: 0, enService: 0, surChantier: 0, atelier: 0, panne: 0, horsService: 0 };

export function additionner(types: TypeFlotte[]): RepartitionFlotte {
  return types.reduce(
    (r, t) => ({
      total: r.total + t.repartition.total,
      enService: r.enService + t.repartition.enService,
      surChantier: r.surChantier + t.repartition.surChantier,
      atelier: r.atelier + t.repartition.atelier,
      panne: r.panne + t.repartition.panne,
      horsService: r.horsService + t.repartition.horsService,
    }),
    { ...VIDE },
  );
}

/** Moyenne pondérée par le nombre de véhicules des types qui ont une valeur ; null si aucun. */
export function moyennePonderee(types: TypeFlotte[], valeur: (t: TypeFlotte) => number | null): number | null {
  let somme = 0;
  let poids = 0;
  for (const t of types) {
    const v = valeur(t);
    if (v === null || v === undefined || t.repartition.total <= 0) continue;
    somme += v * t.repartition.total;
    poids += t.repartition.total;
  }
  return poids > 0 ? Math.round((somme / poids) * 10) / 10 : null;
}

function uniteCommune(types: TypeFlotte[]): string | null {
  const unites = new Set(types.map((t) => t.uniteUsage).filter((u): u is string => !!u));
  return unites.size === 1 ? [...unites][0] : null;
}

function categorieDe(t: TypeFlotte): CategorieEngin {
  return t.categorie === "ENGIN_CHANTIER" ? "ENGIN_CHANTIER" : "VEHICULE_ROUTIER";
}

function synthese(types: TypeFlotte[]) {
  const unite = uniteCommune(types);
  return {
    repartition: additionner(types),
    tauxUtilisation: moyennePonderee(types, (t) => t.tauxUtilisation),
    // Un usage moyen n'a de sens que dans une seule unité (km ou h).
    usageParJour: unite ? moyennePonderee(types, (t) => t.usageParJour) : null,
    uniteUsage: unite,
  };
}

export function flotteParFamille(types: TypeFlotte[]): CategorieFlotte[] {
  return ORDRE.map((categorie) => {
    const dansCategorie = types.filter((t) => categorieDe(t) === categorie);
    const groupes = new Map<string, { famille: string | null; types: TypeFlotte[] }>();
    for (const t of dansCategorie) {
      const famille = t.idTypeEngin === null ? null : normaliserFamille(t.famille);
      const cle = famille?.toLocaleLowerCase("fr") ?? "";
      const g = groupes.get(cle) ?? { famille, types: [] };
      g.types.push(t);
      groupes.set(cle, g);
    }
    const familles: GroupeFlotte[] = [...groupes.values()]
      .map((g) => ({ famille: g.famille, libelle: g.famille ?? SANS_FAMILLE, types: g.types, ...synthese(g.types) }))
      .sort(
        (a, b) =>
          Number(a.famille === null) - Number(b.famille === null) ||
          b.repartition.total - a.repartition.total ||
          a.libelle.localeCompare(b.libelle, "fr"),
      );
    return {
      categorie,
      libelle: LIBELLES_CATEGORIE[categorie],
      familles,
      avecFamilles: familles.some((f) => f.famille !== null),
      ...synthese(dansCategorie),
    };
  }).filter((c) => c.repartition.total > 0);
}
