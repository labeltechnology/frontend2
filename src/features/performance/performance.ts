import { normaliserNombre } from "@/lib/utils";
import type {
  ClassementUsage,
  CoutsPerformance,
  KpiParc,
  NiveauEcart,
  PerformanceVehicule,
  StatutKpi,
  SyntheseTypePerformance,
} from "@/types/performance";

/**
 * Règles d'affichage de la page « Performance et utilisation » (2026-09-28),
 * pures et testées : libellés, couleurs (jetons badge-* du thème, clair et
 * nuit), filtres et tris du tableau des véhicules.
 */

/** Nombre à la française, sans zéros inutiles : « 50 », « 62,5 », « 1 520 ». */
export function nombreFr(valeur: number, decimalesMax = 0): string {
  return valeur.toLocaleString("fr-FR", { maximumFractionDigits: decimalesMax });
}

// --- KPI -------------------------------------------------------------------

export const STATUTS_KPI: Record<StatutKpi, { libelle: string; classes: string; barre: string }> = {
  ATTEINT: { libelle: "Atteint", classes: "bg-badge-successBg text-badge-successFg", barre: "bg-badge-successFg" },
  PROCHE: { libelle: "Proche", classes: "bg-badge-warningBg text-badge-warningFg", barre: "bg-badge-warningFg" },
  NON_ATTEINT: { libelle: "Non atteint", classes: "bg-badge-dangerBg text-badge-dangerFg", barre: "bg-badge-dangerFg" },
  SANS_OBJECTIF: { libelle: "Objectif à fixer", classes: "bg-badge-neutralBg text-badge-neutralFg", barre: "bg-badge-infoFg" },
  NON_CALCULE: { libelle: "Pas de donnée", classes: "bg-badge-neutralBg text-badge-neutralFg", barre: "bg-badge-neutralFg" },
};

/** Nombre de décimales selon l'unité : 0 pour les montants et les km, 1 sinon. */
export function decimalesUnite(unite: string): number {
  return unite === "Ar" || unite === "km/mois" || unite === "véhicules" || unite === "Ar/h" ? 0 : 1;
}

/** « 62,5 % », « 1 520 km/mois », « 2 véhicules », « 1 véhicule », « — ». */
export function formaterValeurUnite(valeur: number | null | undefined, unite: string): string {
  if (valeur === null || valeur === undefined) return "—";
  const nombre = nombreFr(valeur, decimalesUnite(unite));
  if (unite === "véhicules") return `${nombre} véhicule${Math.abs(valeur) >= 2 ? "s" : ""}`;
  return `${nombre} ${unite}`;
}

/**
 * Remplissage de la jauge d'un KPI (0 à 100) : part de l'objectif atteinte.
 * Sens BAISSE : pleine si la valeur est sous l'objectif, puis décroît.
 * null si pas de valeur ou pas d'objectif.
 */
export function progressionObjectif(kpi: Pick<KpiParc, "valeur" | "objectif" | "sens">): number | null {
  const { valeur, objectif, sens } = kpi;
  if (valeur === null || objectif === null) return null;
  if (sens === "HAUSSE") {
    if (objectif <= 0) return 100;
    return Math.max(0, Math.min(100, (valeur / objectif) * 100));
  }
  if (valeur <= objectif) return 100;
  if (valeur <= 0) return 100;
  return Math.max(0, Math.min(100, (objectif / valeur) * 100));
}

/** Objectif saisi : null = retirer l'objectif ; undefined = saisie invalide. */
export function lireObjectif(texte: string, unite: string): number | null | undefined {
  // Même normalisation que partout ailleurs (lib/utils) : sans elle, un
  // objectif saisi « 85 000 » était refusé à cause de l'espace.
  const brut = normaliserNombre(texte);
  if (brut === "") return null;
  const valeur = Number(brut);
  if (!Number.isFinite(valeur) || valeur < 0) return undefined;
  if (unite === "%" && valeur > 100) return undefined;
  return valeur;
}

// --- Écart au coût de référence --------------------------------------------

export const NIVEAUX_ECART: Record<NiveauEcart, { libelle: string; classes: string }> = {
  FAVORABLE: { libelle: "Conforme", classes: "bg-badge-successBg text-badge-successFg" },
  VIGILANCE: { libelle: "À surveiller", classes: "bg-badge-warningBg text-badge-warningFg" },
  DEFAVORABLE: { libelle: "Trop cher", classes: "bg-badge-dangerBg text-badge-dangerFg" },
  SANS_REFERENCE: { libelle: "Sans référence", classes: "bg-badge-neutralBg text-badge-neutralFg" },
};

/** « +12,5 % », « -4 % », ou null sans référence. */
export function texteEcart(pourcent: number | null | undefined): string | null {
  if (pourcent === null || pourcent === undefined) return null;
  return `${pourcent > 0 ? "+" : ""}${nombreFr(pourcent, 1)} %`;
}

/** « 455,2 Ar/km » ou « — ». */
export function texteCoutUnitaire(cout: number | null | undefined, unite: "km" | "h"): string {
  return cout === null || cout === undefined ? "—" : `${nombreFr(cout, unite === "h" ? 0 : 1)} Ar/${unite}`;
}

// --- Utilisation ---------------------------------------------------------------

export const CLASSEMENTS: Record<ClassementUsage, { libelle: string; classes: string }> = {
  SOUS_UTILISE: { libelle: "Sous-utilisé", classes: "bg-badge-warningBg text-badge-warningFg" },
  NORMAL: { libelle: "Bien utilisé", classes: "bg-badge-successBg text-badge-successFg" },
  NON_EVALUE: { libelle: "Non évalué", classes: "bg-badge-neutralBg text-badge-neutralFg" },
};

/** Couleur de la jauge d'utilisation d'un véhicule par rapport au seuil de son type. */
export function classeTaux(taux: number | null, seuil: number | null | undefined): string {
  if (taux === null) return "bg-badge-neutralFg";
  if (seuil === null || seuil === undefined) return "bg-badge-infoFg";
  return taux >= seuil ? "bg-badge-successFg" : "bg-badge-warningFg";
}

/** Usage de la période : km (routier) ou heures (engin de chantier). */
export function usageVehicule(v: Pick<PerformanceVehicule, "uniteUsage" | "kilometres" | "heures">): number {
  return v.uniteUsage === "h" ? v.heures : v.kilometres;
}

export type FiltreVehicules = "TOUS" | "SOUS_UTILISES" | "EN_TROP" | "TROP_CHERS";

export const FILTRES_VEHICULES: { cle: FiltreVehicules; libelle: string }[] = [
  { cle: "TOUS", libelle: "Tous" },
  { cle: "SOUS_UTILISES", libelle: "Sous-utilisés" },
  { cle: "EN_TROP", libelle: "En trop" },
  { cle: "TROP_CHERS", libelle: "Au-dessus de la référence" },
];

export function correspondFiltre(v: PerformanceVehicule, filtre: FiltreVehicules): boolean {
  switch (filtre) {
    case "TOUS":
      return true;
    case "SOUS_UTILISES":
      return v.classement === "SOUS_UTILISE";
    case "EN_TROP":
      return v.enTrop;
    case "TROP_CHERS":
      return v.niveauEcart === "VIGILANCE" || v.niveauEcart === "DEFAVORABLE";
  }
}

export function compterParFiltre(vehicules: PerformanceVehicule[]): Record<FiltreVehicules, number> {
  const compte: Record<FiltreVehicules, number> = { TOUS: 0, SOUS_UTILISES: 0, EN_TROP: 0, TROP_CHERS: 0 };
  for (const v of vehicules) {
    for (const { cle } of FILTRES_VEHICULES) if (correspondFiltre(v, cle)) compte[cle] += 1;
  }
  return compte;
}

function sansAccents(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export type TriVehicules = "TAUX_CROISSANT" | "TAUX_DECROISSANT" | "COUT_UNITAIRE" | "COUT_TOTAL" | "NOM";

export const TRIS_VEHICULES: { cle: TriVehicules; libelle: string }[] = [
  { cle: "TAUX_CROISSANT", libelle: "Les moins utilisés d'abord" },
  { cle: "TAUX_DECROISSANT", libelle: "Les plus utilisés d'abord" },
  { cle: "COUT_UNITAIRE", libelle: "Écart à la référence" },
  { cle: "COUT_TOTAL", libelle: "Coût total" },
  { cle: "NOM", libelle: "Nom" },
];

/** Filtre, recherche (sans accents, sur le véhicule et son type) puis tri — sans modifier la liste reçue. */
export function vehiculesAffiches(
  vehicules: PerformanceVehicule[],
  filtre: FiltreVehicules,
  recherche: string,
  tri: TriVehicules,
): PerformanceVehicule[] {
  const terme = sansAccents(recherche.trim());
  const retenus = vehicules.filter(
    (v) => correspondFiltre(v, filtre) && (!terme || sansAccents(`${v.libelleVehicule} ${v.libelleType}`).includes(terme)),
  );
  const taux = (v: PerformanceVehicule) => v.tauxUtilisation ?? -1;
  const ecart = (v: PerformanceVehicule) => v.ecartReferencePourcent ?? Number.NEGATIVE_INFINITY;
  const parNom = (a: PerformanceVehicule, b: PerformanceVehicule) => a.libelleVehicule.localeCompare(b.libelleVehicule, "fr");
  return [...retenus].sort((a, b) => {
    switch (tri) {
      case "TAUX_CROISSANT":
        return taux(a) - taux(b) || parNom(a, b);
      case "TAUX_DECROISSANT":
        return taux(b) - taux(a) || parNom(a, b);
      case "COUT_UNITAIRE":
        return ecart(b) - ecart(a) || parNom(a, b);
      case "COUT_TOTAL":
        return b.couts.total - a.couts.total || parNom(a, b);
      case "NOM":
        return parNom(a, b);
    }
  });
}

// --- Coûts et types --------------------------------------------------------------

export interface PartCout {
  cle: keyof Omit<CoutsPerformance, "total">;
  libelle: string;
  montant: number;
  part: number;
  classe: string;
}

/** Postes de coût retenus, avec leur part du total (%), dans l'ordre du plus gros au plus petit. */
export function partsCouts(couts: CoutsPerformance): PartCout[] {
  const postes: Omit<PartCout, "part">[] = [
    { cle: "carburant", libelle: "Carburant", montant: couts.carburant, classe: "bg-badge-infoFg" },
    { cle: "maintenance", libelle: "Maintenance", montant: couts.maintenance, classe: "bg-primary" },
    { cle: "locationEntrante", libelle: "Location entrante", montant: couts.locationEntrante, classe: "bg-badge-neutralFg" },
    { cle: "incidents", libelle: "Incidents", montant: couts.incidents, classe: "bg-badge-warningFg" },
  ];
  const total = postes.reduce((s, p) => s + p.montant, 0);
  return postes
    .map((p) => ({ ...p, part: total > 0 ? Math.round((p.montant / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.montant - a.montant);
}

/** Explication des véhicules en trop d'un type, en une phrase. */
export function texteEnTrop(t: Pick<SyntheseTypePerformance, "libelle" | "nombreVehicules" | "picSimultane" | "vehiculesEnTrop">): string {
  const pic =
    t.picSimultane === 0
      ? "aucun n'a servi sur la période"
      : `au plus ${t.picSimultane} ${t.picSimultane > 1 ? "ont servi" : "a servi"} le même jour`;
  return `${t.nombreVehicules} « ${t.libelle} » dans le parc, ${pic} : ${t.vehiculesEnTrop} en trop.`;
}
