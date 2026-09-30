import type { Chantier, CreerDemandeRequest, DemandeMateriel, PrioriteChantier, StatutDemande } from "@/types/chantier";

/**
 * Demandes de matériel (V64, 2026-09-29) — logique pure : libellés, contrôles
 * de saisie (mêmes règles que ReglesDemande côté serveur), actions permises, tri.
 */

export const LIBELLES_STATUT_DEMANDE: Record<StatutDemande, string> = {
  EN_ATTENTE: "En attente",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
  SERVIE: "Servie",
  ANNULEE: "Annulée",
};

export const VARIANT_STATUT_DEMANDE: Record<StatutDemande, "default" | "success" | "warning" | "destructive" | "outline"> = {
  EN_ATTENTE: "warning",
  ACCEPTEE: "default",
  REFUSEE: "destructive",
  SERVIE: "success",
  ANNULEE: "outline",
};

export const QUANTITE_MAX = 50;

export interface SaisieDemande {
  idTypeEngin: number | null;
  quantite: string;
  dateDebut: string;
  dateFin: string;
  priorite: PrioriteChantier;
  motif: string;
}

export function saisieDemande(chantier: Pick<Chantier, "dateDebutPrevue" | "dateFinPrevue">, priorite: PrioriteChantier,
  aujourdhui: string): SaisieDemande {
  const debut = chantier.dateDebutPrevue > aujourdhui ? chantier.dateDebutPrevue : aujourdhui;
  return { idTypeEngin: null, quantite: "1", dateDebut: debut, dateFin: chantier.dateFinPrevue, priorite, motif: "" };
}

export function problemeDemande(
  s: SaisieDemande,
  chantier: Pick<Chantier, "dateDebutPrevue" | "dateFinPrevue" | "statut">,
  aujourdhui: string,
): string | null {
  if (chantier.statut !== "PLANIFIE" && chantier.statut !== "EN_COURS") return "Le chantier est terminé ou annulé.";
  if (s.idTypeEngin === null) return "Choisissez le type de véhicule.";
  const q = Number(s.quantite);
  if (!Number.isInteger(q) || q < 1 || q > QUANTITE_MAX) return `La quantité va de 1 à ${QUANTITE_MAX}.`;
  if (!s.dateDebut || !s.dateFin || s.dateFin < s.dateDebut) return "Indiquez une période valide.";
  if (s.dateDebut < aujourdhui) return "La période ne peut pas commencer dans le passé.";
  if (s.dateDebut < chantier.dateDebutPrevue || s.dateFin > chantier.dateFinPrevue) {
    return "La période doit être comprise dans les dates du chantier.";
  }
  if (s.motif.length > 1000) return "Motif : 1 000 caractères au plus.";
  return null;
}

export function requeteDemande(s: SaisieDemande, idChantier: number): CreerDemandeRequest {
  return {
    idChantier,
    idTypeEngin: s.idTypeEngin ?? 0,
    quantite: Number(s.quantite),
    dateDebut: s.dateDebut,
    dateFin: s.dateFin,
    priorite: s.priorite,
    motif: s.motif.trim() || undefined,
  };
}

export function peutRepondre(d: Pick<DemandeMateriel, "statut">): boolean {
  return d.statut === "EN_ATTENTE";
}

/** Le demandeur ou la gestion du parc annule une demande en attente ou acceptée. */
export function peutAnnuler(d: Pick<DemandeMateriel, "statut" | "idDemandeur">, idUtilisateur: number | undefined, gestion: boolean): boolean {
  return (d.statut === "EN_ATTENTE" || d.statut === "ACCEPTEE") && (gestion || (idUtilisateur !== undefined && d.idDemandeur === idUtilisateur));
}

const RANG_PRIORITE: Record<PrioriteChantier, number> = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2 };
const RANG_STATUT: Record<StatutDemande, number> = { EN_ATTENTE: 0, ACCEPTEE: 1, SERVIE: 2, REFUSEE: 3, ANNULEE: 4 };

/** En attente d'abord, par priorité puis par ancienneté (la plus ancienne d'abord) ; les autres, les plus récentes d'abord. */
export function trierDemandes(demandes: DemandeMateriel[]): DemandeMateriel[] {
  return [...demandes].sort((a, b) => {
    const s = RANG_STATUT[a.statut] - RANG_STATUT[b.statut];
    if (s !== 0) return s;
    if (a.statut === "EN_ATTENTE") {
      return RANG_PRIORITE[a.priorite] - RANG_PRIORITE[b.priorite] || a.dateDemande.localeCompare(b.dateDemande);
    }
    return b.dateDemande.localeCompare(a.dateDemande);
  });
}

/** « 3,5 h », « 2 j » ; « — » sans valeur. */
export function libelleDelai(valeur: number | null | undefined, unite: "h" | "j"): string {
  return valeur == null ? "—" : `${valeur.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${unite}`;
}
