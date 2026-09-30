import { nombreFr } from "@/features/performance/performance";
import { lireNombreFacultatif } from "@/features/performance/reglages-type";
import type { NiveauConduite } from "@/types/conduite";
import type {
  CauseEcart,
  CoutVehicule,
  EnregistrerCoutVehiculeRequest,
  LigneBudgetCarburant,
  ModeAcquisition,
  NiveauProbleme,
  TcoParc,
} from "@/types/couts";

/**
 * Règles d'affichage de la page « Coûts et rentabilité » et de l'onglet
 * « Coûts » de la fiche (2026-09-29), pures et testées. Couleurs : jetons
 * badge-* du thème (clair et nuit), toujours avec un texte.
 */

export const MODES_ACQUISITION: Record<ModeAcquisition, string> = {
  ACHAT: "Achat",
  LOCATION_LONGUE_DUREE: "Location longue durée",
  CREDIT_BAIL: "Crédit-bail",
};

export const NIVEAUX_PROBLEME: Record<NiveauProbleme, { libelle: string; classes: string }> = {
  A_REMPLACER: { libelle: "À remplacer", classes: "bg-badge-dangerBg text-badge-dangerFg" },
  A_SURVEILLER: { libelle: "À surveiller", classes: "bg-badge-warningBg text-badge-warningFg" },
  NORMAL: { libelle: "Normal", classes: "bg-badge-successBg text-badge-successFg" },
};

export const NIVEAUX_CONDUITE: Record<NiveauConduite, { libelle: string; classes: string; barre: string }> = {
  BON: { libelle: "Bon", classes: "bg-badge-successBg text-badge-successFg", barre: "bg-badge-successFg" },
  A_SURVEILLER: { libelle: "À surveiller", classes: "bg-badge-warningBg text-badge-warningFg", barre: "bg-badge-warningFg" },
  A_FORMER: { libelle: "À former", classes: "bg-badge-dangerBg text-badge-dangerFg", barre: "bg-badge-dangerFg" },
  NON_NOTE: { libelle: "Non noté", classes: "bg-badge-neutralBg text-badge-neutralFg", barre: "bg-badge-neutralFg" },
};

export const CAUSES_ECART: Record<CauseEcart, string> = {
  USAGE: "Plus ou moins de km (ou d'heures) que prévu",
  CONSOMMATION: "Consommation différente de la prévision",
  PRIX: "Prix du litre différent de la prévision",
  AUCUNE: "Aucun écart significatif",
};

/** « 1 250 000 Ar » ou « — ». */
export function texteMontant(montant: number | null | undefined): string {
  return montant === null || montant === undefined ? "—" : `${nombreFr(montant)} Ar`;
}

/** Écart signé : « +1 200 000 Ar », « -300 000 Ar ». */
export function texteEcartMontant(ecart: number): string {
  return `${ecart > 0 ? "+" : ""}${nombreFr(ecart)} Ar`;
}

/** Dépassement en rouge, économie en vert, rien en gris. */
export function classeEcart(ecart: number): string {
  if (ecart > 0) return "text-badge-dangerFg";
  if (ecart < 0) return "text-badge-successFg";
  return "text-muted-foreground";
}

// --- TCO ------------------------------------------------------------------------

export interface PosteTco {
  cle: string;
  libelle: string;
  groupe: "Variables" | "Fixes";
  montant: number;
  part: number;
  classe: string;
}

/** Deux couleurs seulement (coûts variables / fixes), avec légende : jamais une couleur par poste. */
export const COULEUR_GROUPE: Record<PosteTco["groupe"], string> = {
  Variables: "bg-primary",
  Fixes: "bg-badge-infoFg",
};

/** Les 9 postes du coût complet, du plus gros au plus petit, avec leur part (%). */
export function postesTco(tco: Pick<TcoParc, "coutsVariables" | "coutsFixes">): PosteTco[] {
  const v = tco.coutsVariables;
  const f = tco.coutsFixes;
  const postes: Omit<PosteTco, "part">[] = [
    { cle: "carburant", libelle: "Carburant", groupe: "Variables", montant: v.carburant, classe: COULEUR_GROUPE.Variables },
    { cle: "maintenance", libelle: "Maintenance", groupe: "Variables", montant: v.maintenance, classe: COULEUR_GROUPE.Variables },
    { cle: "location", libelle: "Location entrante", groupe: "Variables", montant: v.locationEntrante, classe: COULEUR_GROUPE.Variables },
    { cle: "incidents", libelle: "Incidents", groupe: "Variables", montant: v.incidents, classe: COULEUR_GROUPE.Variables },
    { cle: "amortissement", libelle: "Amortissement", groupe: "Fixes", montant: f.amortissement, classe: COULEUR_GROUPE.Fixes },
    { cle: "loyers", libelle: "Loyers", groupe: "Fixes", montant: f.loyers, classe: COULEUR_GROUPE.Fixes },
    { cle: "assurance", libelle: "Assurance", groupe: "Fixes", montant: f.assurance, classe: COULEUR_GROUPE.Fixes },
    { cle: "taxes", libelle: "Taxes et vignette", groupe: "Fixes", montant: f.taxesEtVignette, classe: COULEUR_GROUPE.Fixes },
    { cle: "autres", libelle: "Autres charges", groupe: "Fixes", montant: f.autres, classe: COULEUR_GROUPE.Fixes },
  ];
  const total = postes.reduce((s, p) => s + p.montant, 0);
  return postes
    .map((p) => ({ ...p, part: total > 0 ? Math.round((p.montant / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.montant - a.montant);
}

// --- Coûts fixes d'un véhicule --------------------------------------------------------

export interface ValeursCoutVehicule {
  modeAcquisition: ModeAcquisition;
  prixAchat: string;
  dateDebutAmortissement: string;
  dureeAmortissementMois: string;
  valeurResiduelle: string;
  loyerMensuel: string;
  primeAssuranceAnnuelle: string;
  taxesAnnuelles: string;
  vignetteAnnuelle: string;
  autresChargesAnnuelles: string;
}

const champ = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function valeursCoutVehicule(c: CoutVehicule | undefined): ValeursCoutVehicule {
  return {
    modeAcquisition: c?.modeAcquisition ?? "ACHAT",
    prixAchat: champ(c?.prixAchat),
    dateDebutAmortissement: c?.dateDebutAmortissement ?? "",
    dureeAmortissementMois: champ(c?.dureeAmortissementMois),
    valeurResiduelle: champ(c?.valeurResiduelle),
    loyerMensuel: champ(c?.loyerMensuel),
    primeAssuranceAnnuelle: champ(c?.primeAssuranceAnnuelle),
    taxesAnnuelles: champ(c?.taxesAnnuelles),
    vignetteAnnuelle: champ(c?.vignetteAnnuelle),
    autresChargesAnnuelles: champ(c?.autresChargesAnnuelles),
  };
}

/** Requête d'enregistrement, ou un message d'erreur si une saisie est invalide. */
export function requeteCoutVehicule(v: ValeursCoutVehicule): EnregistrerCoutVehiculeRequest | string {
  const nombres: Record<string, number | null> = {};
  const champs = [
    ["prixAchat", "Prix d'achat"],
    ["valeurResiduelle", "Valeur résiduelle"],
    ["loyerMensuel", "Loyer mensuel"],
    ["primeAssuranceAnnuelle", "Prime d'assurance"],
    ["taxesAnnuelles", "Taxes"],
    ["vignetteAnnuelle", "Vignette"],
    ["autresChargesAnnuelles", "Autres charges"],
  ] as const;
  for (const [cle, libelle] of champs) {
    const n = lireNombreFacultatif(v[cle]);
    if (n === null) return `${libelle} : nombre positif attendu.`;
    nombres[cle] = n ?? null;
  }
  const duree = lireNombreFacultatif(v.dureeAmortissementMois, 360);
  if (duree === null || (duree !== undefined && (duree < 1 || !Number.isInteger(duree)))) {
    return "Durée d'amortissement : nombre entier de mois, de 1 à 360.";
  }
  if (nombres.prixAchat !== null && nombres.valeurResiduelle !== null && nombres.valeurResiduelle > nombres.prixAchat) {
    return "La valeur résiduelle ne peut pas dépasser le prix d'achat.";
  }
  const achat = v.modeAcquisition === "ACHAT";
  return {
    modeAcquisition: v.modeAcquisition,
    prixAchat: nombres.prixAchat,
    dateDebutAmortissement: achat && v.dateDebutAmortissement ? v.dateDebutAmortissement : null,
    dureeAmortissementMois: achat ? (duree ?? null) : null,
    valeurResiduelle: achat ? nombres.valeurResiduelle : null,
    loyerMensuel: achat ? null : nombres.loyerMensuel,
    primeAssuranceAnnuelle: nombres.primeAssuranceAnnuelle,
    taxesAnnuelles: nombres.taxesAnnuelles,
    vignetteAnnuelle: nombres.vignetteAnnuelle,
    autresChargesAnnuelles: nombres.autresChargesAnnuelles,
  };
}

// --- Budget carburant ------------------------------------------------------------------

export const NOMS_MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Montant annuel prévu : usage × consommation × prix (L/100 km pour un véhicule routier, L/h pour un engin). */
export function montantBudgetPrevu(usage: number, consommation: number, prix: number, unite: "km" | "h"): number {
  const litres = unite === "h" ? usage * consommation : (usage * consommation) / 100;
  return Math.round(litres * prix);
}

/**
 * Parts mensuelles saisies (12 champs, en %) : null si tout est vide (parts
 * égales), sinon 12 nombres ; un message si une saisie est invalide ou si le
 * total ne fait pas 100 % (à 0,5 près).
 */
export function lirePartsMensuelles(textes: string[]): number[] | null | string {
  if (textes.every((t) => t.trim() === "")) return null;
  const parts: number[] = [];
  for (const [i, t] of textes.entries()) {
    const n = lireNombreFacultatif(t);
    if (n === null || n === undefined) return `Part de ${NOMS_MOIS[i]} : nombre positif attendu (ou laissez tout vide).`;
    parts.push(n);
  }
  const total = parts.reduce((s, p) => s + p, 0);
  if (Math.abs(total - 100) > 0.5) return `Le total des parts fait ${nombreFr(total, 1)} % au lieu de 100 %.`;
  return parts;
}

/** Les trois effets qui expliquent l'écart d'une ligne, du plus fort au plus faible. */
export function effetsEcart(l: Pick<LigneBudgetCarburant, "effetUsage" | "effetConsommation" | "effetPrix" | "uniteUsage">) {
  return [
    { cle: "usage", libelle: l.uniteUsage === "h" ? "Heures de travail" : "Kilomètres parcourus", montant: l.effetUsage },
    { cle: "consommation", libelle: l.uniteUsage === "h" ? "Consommation L/h" : "Consommation L/100 km", montant: l.effetConsommation },
    { cle: "prix", libelle: "Prix du litre", montant: l.effetPrix },
  ].sort((a, b) => Math.abs(b.montant) - Math.abs(a.montant));
}

// --- Mois (conduite) ---------------------------------------------------------------------

/** « 2026-09 » pour une date. */
export function moisDe(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** « septembre 2026 ». */
export function libelleMois(mois: string): string {
  const [a, m] = mois.split("-").map(Number);
  if (!a || !m) return mois;
  return new Date(a, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** Les n derniers mois, du plus récent au plus ancien. */
export function derniersMois(aujourdhui: Date, n: number): string[] {
  const liste: string[] = [];
  for (let i = 0; i < n; i++) liste.push(moisDe(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i, 1)));
  return liste;
}
