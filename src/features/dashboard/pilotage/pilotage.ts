import { normaliserNombre } from "@/lib/utils";
import type { ElementATraiter } from "@/features/dashboard/indicateurs";
import type {
  AlertePilotage,
  DirectionTendance,
  EtatBudget,
  EtatKpi,
  KpiPilotage,
  LigneCoutMois,
  NiveauAlertePilotage,
} from "@/types/pilotage";

/**
 * Logique d'affichage du tableau de bord de direction (2026-09-30) —
 * fonctions pures, testées. Couleurs : jamais seules, toujours avec un
 * libellé (accessibilité).
 */

const nombre = (v: number, decimales = 0) =>
  v.toLocaleString("fr-FR", { maximumFractionDigits: decimales, minimumFractionDigits: 0 });

/** Valeur d'un KPI avec son unité : « 87 % », « 1 250 Ar/km », « 8 pannes », « 82/100 ». */
export function texteValeurKpi(valeur: number | null, unite: string): string {
  if (valeur === null) return "—";
  if (unite === "%") return `${nombre(valeur, 1)} %`;
  if (unite === "/100") return `${nombre(valeur)}/100`;
  if (unite === "pannes") return `${nombre(valeur)} panne${valeur > 1 ? "s" : ""}`;
  return `${nombre(valeur, valeur < 100 ? 1 : 0)} ${unite}`;
}

export interface PresentationEtat {
  libelle: string;
  classe: string;
  lisere: string;
}

export const PRESENTATION_ETAT_KPI: Record<EtatKpi, PresentationEtat> = {
  ATTEINT: { libelle: "Objectif atteint", classe: "bg-badge-successBg text-badge-successFg", lisere: "bg-badge-successFg" },
  A_SURVEILLER: { libelle: "À surveiller", classe: "bg-badge-warningBg text-badge-warningFg", lisere: "bg-badge-warningFg" },
  CRITIQUE: { libelle: "Seuil d'alerte franchi", classe: "bg-badge-dangerBg text-badge-dangerFg", lisere: "bg-badge-dangerFg" },
  OBJECTIF_A_FIXER: { libelle: "Objectif à fixer", classe: "bg-badge-neutralBg text-badge-neutralFg", lisere: "bg-border" },
  SANS_DONNEE: { libelle: "Pas de donnée", classe: "bg-badge-neutralBg text-badge-neutralFg", lisere: "bg-border" },
};

/** Flèche de tendance : ↑, ↓ ou →. */
export function flecheTendance(direction: DirectionTendance): string {
  return direction === "HAUSSE" ? "↑" : direction === "BAISSE" ? "↓" : "→";
}

/** « ↓ -2 pts », « ↑ +60 % », « → stable », « nouveau » (précédent à zéro). */
export function texteTendance(kpi: Pick<KpiPilotage, "tendance" | "valeurPrecedente" | "valeur">): string {
  const t = kpi.tendance;
  if (kpi.valeur === null || kpi.valeurPrecedente === null) return "pas de comparaison";
  if (t.direction === "STABLE") return "→ stable";
  if (t.variation === null) return `${flecheTendance(t.direction)} en hausse (0 avant)`;
  const signe = t.variation > 0 ? "+" : "";
  return `${flecheTendance(t.direction)} ${signe}${nombre(t.variation, 1)} ${t.enPoints ? "pt" + (Math.abs(t.variation) >= 2 ? "s" : "") : "%"}`;
}

/** Classe de la tendance : verte si elle va dans le bon sens, rouge sinon, grise si stable. */
export function classeTendance(amelioration: boolean | null): string {
  if (amelioration === null) return "text-muted-foreground";
  return amelioration ? "text-badge-successFg" : "text-badge-dangerFg";
}

/** Rappel de l'objectif et du seuil : « Cible 90 % · alerte sous 85 % ». */
export function texteCible(kpi: Pick<KpiPilotage, "objectif" | "seuilAlerte" | "unite" | "sens">): string {
  if (kpi.objectif === null) return "Objectif à fixer";
  const cible = `Cible ${kpi.sens === "BAISSE" ? "≤ " : ""}${texteValeurKpi(kpi.objectif, kpi.unite)}`;
  if (kpi.seuilAlerte === null) return cible;
  return `${cible} · alerte ${kpi.sens === "HAUSSE" ? "sous" : "au-delà de"} ${texteValeurKpi(kpi.seuilAlerte, kpi.unite)}`;
}

/** Saisie d'un nombre facultatif (virgule acceptée) : null si vide, undefined si invalide. */
export function lireNombre(texte: string): number | null | undefined {
  const t = normaliserNombre(texte);
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Contrôle d'un réglage (même règle que le serveur) : message d'erreur, ou
 * null s'il est accepté.
 */
export function problemeReglage(
  objectif: number | null | undefined,
  seuil: number | null | undefined,
  kpi: Pick<KpiPilotage, "sens" | "unite">,
): string | null {
  if (objectif === undefined || seuil === undefined) return "Saisissez des nombres positifs (ou laissez vide).";
  if (kpi.unite === "%" && ((objectif ?? 0) > 100 || (seuil ?? 0) > 100)) return "Un pourcentage ne peut pas dépasser 100.";
  if (objectif !== null && seuil !== null) {
    if (kpi.sens === "HAUSSE" && seuil > objectif) return "Le seuil d'alerte doit être inférieur ou égal à l'objectif.";
    if (kpi.sens === "BAISSE" && seuil < objectif) return "Le seuil d'alerte doit être supérieur ou égal à l'objectif.";
  }
  return null;
}

// --- Alertes urgentes -------------------------------------------------------

export interface AlerteUrgente {
  cle: string;
  niveau: NiveauAlertePilotage;
  categorie: string;
  titre: string;
  details: string[];
  impactJour: number | null;
  montant: number | null;
  libelleMontant: string | null;
  action: string | null;
  lien: string;
}

const LIBELLES_CATEGORIE: Record<AlertePilotage["categorie"], string> = {
  IMMOBILISATION: "Véhicule immobilisé",
  BUDGET: "Budget",
  CHANTIER: "Chantier",
};

/**
 * Alertes urgentes : les alertes chiffrées du serveur (immobilisations,
 * budgets, chantiers), puis ce que « À traiter » signale déjà (alertes,
 * incidents, documents, retours de mission). Les véhicules en panne de
 * « À traiter » sont écartés : le serveur les donne, chiffrés. Critiques
 * d'abord, dans l'ordre reçu.
 */
export function alertesUrgentes(serveur: AlertePilotage[], aTraiter: ElementATraiter[]): AlerteUrgente[] {
  const chiffrees: AlerteUrgente[] = serveur.map((a) => ({ ...a, categorie: LIBELLES_CATEGORIE[a.categorie] }));
  const autres: AlerteUrgente[] = aTraiter
    .filter((e) => e.categorie !== "Véhicule")
    .map((e) => ({
      cle: e.cle,
      niveau: e.urgence === "critique" ? "CRITIQUE" : "AVERTISSEMENT",
      categorie: e.categorie,
      titre: e.titre,
      details: [e.detail],
      impactJour: null,
      montant: null,
      libelleMontant: null,
      action: null,
      lien: e.lien,
    }));
  const toutes = [...chiffrees, ...autres];
  return [...toutes.filter((a) => a.niveau === "CRITIQUE"), ...toutes.filter((a) => a.niveau !== "CRITIQUE")];
}

// --- Flotte -----------------------------------------------------------------

/** Part arrondie en % (0 si total nul). */
export function part(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/** Durée d'immobilisation : « 6 h », « 2 j ». */
export function texteDuree(heures: number | null): string {
  if (heures === null) return "—";
  return heures < 48 ? `${heures} h` : `${Math.floor(heures / 24)} j`;
}

/** Usage par jour : « 2,3 h/j », « 85 km/j ». */
export function texteUsageJour(usage: number | null, unite: string | null): string {
  if (usage === null || !unite) return "—";
  return `${nombre(usage, 1)} ${unite}/j`;
}

// --- Coûts du mois ----------------------------------------------------------

export const PRESENTATION_ETAT_BUDGET: Record<EtatBudget, PresentationEtat> = {
  BUDGET_TENU: { libelle: "Tenu", classe: "bg-badge-successBg text-badge-successFg", lisere: "bg-badge-successFg" },
  RISQUE_DEPASSEMENT: { libelle: "Risque", classe: "bg-badge-warningBg text-badge-warningFg", lisere: "bg-badge-warningFg" },
  DEPASSE: { libelle: "Dépassé", classe: "bg-badge-dangerBg text-badge-dangerFg", lisere: "bg-badge-dangerFg" },
  SANS_BUDGET: { libelle: "Sans budget", classe: "bg-badge-neutralBg text-badge-neutralFg", lisere: "bg-border" },
};

/** Largeurs des barres réel / projection, en % du plus grand de (budget, projection). */
export function barresBudget(l: Pick<LigneCoutMois, "budget" | "reel" | "projection">): { reel: number; projection: number; budget: number } {
  const max = Math.max(l.budget ?? 0, l.projection, l.reel, 1);
  return {
    reel: Math.round((l.reel / max) * 100),
    projection: Math.round((l.projection / max) * 100),
    budget: l.budget === null ? 0 : Math.round((l.budget / max) * 100),
  };
}

/** Mois « AAAA-MM » d'une date. */
export function moisCourant(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Mois précédent / suivant (« 2026-01 » - 1 = « 2025-12 »). */
export function decalerMois(mois: string, delta: number): string {
  const [a, m] = mois.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return moisCourant(d);
}

const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 2026-09 » → « septembre 2026 ». */
export function libelleMoisLong(mois: string): string {
  const [a, m] = mois.split("-").map(Number);
  return `${NOMS_MOIS[m - 1] ?? mois} ${a}`;
}
