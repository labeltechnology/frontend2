import { nombreFr } from "@/features/performance/performance";
import { normaliserNombre } from "@/lib/utils";
import type {
  ConclusionBesoin,
  EnregistrerCessionRequest,
  FinDeVieVehicule,
  MotifCession,
  PlanVehicule,
  PrioriteRenouvellement,
} from "@/types/renouvellement";

/**
 * Règles d'affichage de la page « Renouvellement » (2026-09-29) : libellés,
 * couleurs, filtres et formulaire de cession. Sans React, testées avec tsx.
 */

export const PRIORITES: Record<PrioriteRenouvellement, { libelle: string; classes: string }> = {
  URGENT: { libelle: "Cette année", classes: "bg-badge-dangerBg text-badge-dangerFg" },
  A_PREVOIR: { libelle: "L'an prochain", classes: "bg-badge-warningBg text-badge-warningFg" },
  PLANIFIE: { libelle: "Planifié", classes: "bg-badge-infoBg text-badge-infoFg" },
  AU_DELA: { libelle: "Au-delà de 5 ans", classes: "bg-badge-neutralBg text-badge-neutralFg" },
};

export const CONCLUSIONS: Record<ConclusionBesoin, { libelle: string; classes: string }> = {
  A_ACQUERIR: { libelle: "À acquérir", classes: "bg-badge-warningBg text-badge-warningFg" },
  ADAPTE: { libelle: "Adapté", classes: "bg-badge-successBg text-badge-successFg" },
  EN_SURPLUS: { libelle: "En surplus", classes: "bg-badge-infoBg text-badge-infoFg" },
  SANS_ACTIVITE: { libelle: "Sans activité", classes: "bg-badge-neutralBg text-badge-neutralFg" },
};

export const MOTIFS_CESSION: Record<MotifCession, string> = {
  VENTE: "Vente",
  REFORME: "Réforme",
  PERTE_TOTALE: "Perte totale (sinistre)",
  AUTRE: "Autre",
};

export const LIBELLES_ENERGIE: Record<string, string> = {
  GASOIL: "Gasoil",
  ESSENCE: "Essence",
  ELECTRIQUE: "Électrique",
  HYBRIDE: "Hybride",
  AUTRE: "Autre",
  NON_RENSEIGNEE: "Non renseignée",
};

export type FiltrePlan = "TOUS" | PrioriteRenouvellement;

export const FILTRES_PLAN: { cle: FiltrePlan; libelle: string }[] = [
  { cle: "TOUS", libelle: "Tous" },
  { cle: "URGENT", libelle: "Cette année" },
  { cle: "A_PREVOIR", libelle: "L'an prochain" },
  { cle: "PLANIFIE", libelle: "Planifiés" },
  { cle: "AU_DELA", libelle: "Au-delà" },
];

/** Véhicules du plan filtrés par priorité et par recherche (sans accents). */
export function vehiculesPlan(vehicules: PlanVehicule[], filtre: FiltrePlan, recherche: string): PlanVehicule[] {
  const cle = normaliser(recherche.trim());
  return vehicules.filter(
    (v) =>
      (filtre === "TOUS" || v.priorite === filtre) &&
      (cle === "" || normaliser(`${v.libelleVehicule} ${v.libelleType ?? ""}`).includes(cle)),
  );
}

export function normaliser(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** « 7,2 ans » ou « Inconnu ». */
export function texteAge(age: number | null): string {
  return age === null ? "Inconnu" : `${nombreFr(age, 1)} ans`;
}

/** « +30 % » (rouge au-delà du seuil de hausse), « -5 % », ou « — ». */
export function texteHausse(hausse: number | null): string {
  if (hausse === null) return "—";
  return `${hausse > 0 ? "+" : ""}${nombreFr(hausse, 1)} %`;
}

export function classeHausse(hausse: number | null, seuil: number): string {
  if (hausse === null) return "text-muted-foreground";
  if (hausse >= seuil) return "text-badge-dangerFg";
  return hausse > 0 ? "text-badge-warningFg" : "text-badge-successFg";
}

/** Plus-value en vert, moins-value en rouge. */
export function texteResultatCession(v: Pick<FinDeVieVehicule, "plusOuMoinsValue">): { texte: string; classe: string } {
  const r = v.plusOuMoinsValue;
  if (r === null) return { texte: "—", classe: "text-muted-foreground" };
  if (r >= 0) return { texte: `+${nombreFr(r)} Ar`, classe: "text-badge-successFg" };
  return { texte: `-${nombreFr(-r)} Ar`, classe: "text-badge-dangerFg" };
}

/** Écart de besoin : « +2 », « -1 », « 0 ». */
export function texteEcartBesoin(ecart: number): string {
  return ecart > 0 ? `+${ecart}` : String(ecart);
}

export interface ValeursCession {
  idEngin: string;
  dateCession: string;
  motif: MotifCession;
  prixCession: string;
  acquereur: string;
  commentaire: string;
}

export function valeursCession(v: FinDeVieVehicule | null, aujourdhui: string): ValeursCession {
  return {
    idEngin: v ? String(v.idEngin) : "",
    dateCession: v?.dateCession ?? aujourdhui,
    motif: v?.motif ?? (v?.statut === "VENDU" ? "VENTE" : "REFORME"),
    prixCession: v?.prixCession === null || v?.prixCession === undefined ? "" : String(v.prixCession),
    acquereur: v?.acquereur ?? "",
    commentaire: v?.commentaire ?? "",
  };
}

/** Requête de cession, ou message d'erreur. */
export function requeteCession(v: ValeursCession, aujourdhui: string): { idEngin: number; requete: EnregistrerCessionRequest } | string {
  const idEngin = Number(v.idEngin);
  if (!idEngin) return "Choisissez le véhicule.";
  if (!v.dateCession) return "Indiquez la date de sortie du parc.";
  if (v.dateCession > aujourdhui) return "La date de sortie ne peut pas être dans le futur.";
  const prixTexte = normaliserNombre(v.prixCession);
  const prix = prixTexte === "" ? null : Number(prixTexte);
  if (prix !== null && (!Number.isFinite(prix) || prix < 0)) return "Prix de cession invalide.";
  if (v.motif === "VENTE" && prix === null) return "Indiquez le prix de vente.";
  const texte = (s: string) => (s.trim() === "" ? null : s.trim());
  return {
    idEngin,
    requete: { dateCession: v.dateCession, motif: v.motif, prixCession: prix, acquereur: texte(v.acquereur), commentaire: texte(v.commentaire) },
  };
}
