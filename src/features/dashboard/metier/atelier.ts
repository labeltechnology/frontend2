import { elementsAlertes, joursAvant, trierATraiter, type ElementATraiter } from "@/features/dashboard/indicateurs";
import { formatDate, libelleEnum } from "@/lib/utils";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";
import type { Alerte } from "@/types/alerte";
import type { Engin } from "@/types/engin";
import type { Maintenance, Piece } from "@/types/maintenance";

/**
 * Tableau de bord de l'atelier (pages par métier, 2026-09-30) — chef et
 * assistant maintenance : « ce qui se passe sur les maintenances ». Calculs
 * purs, sans React (testés seuls) ; TableauBordAtelier ne fait qu'afficher.
 */

/** Horizon du planning : maintenances prévues dans les 7 prochains jours. */
export const HORIZON_PLANNING_JOURS = 7;
/** Retard au-delà duquel une maintenance planifiée devient critique. */
export const RETARD_CRITIQUE_JOURS = 7;

export interface IndicateursAtelier {
  enCours: number;
  /** Planifiées aujourd'hui ou dans les 7 jours. */
  aVenir: number;
  /** Planifiées dont la date prévue est passée. */
  enRetard: number;
  /** Planifiées sans date prévue. */
  sansDate: number;
  /** Véhicules en panne ou en maintenance. */
  immobilises: number;
  enPanne: number;
  piecesStockBas: number;
  piecesEnRupture: number;
  alertes: number;
  alertesCritiques: number;
}

function estImmobilise(e: Engin): boolean {
  return e.statut === "EN_PANNE" || e.statut === "EN_MAINTENANCE";
}

/** Jours avant la date prévue d'une maintenance planifiée (négatif = en retard) ; null sans date. */
export function joursAvantPrevue(m: Maintenance, maintenant: Date): number | null {
  return m.statut === "PLANIFIEE" && m.datePrevue ? joursAvant(m.datePrevue, maintenant) : null;
}

export function indicateursAtelier(sources: {
  maintenances: Maintenance[];
  engins: Engin[];
  pieces: Piece[];
  alertes: Alerte[];
  maintenant: Date;
}): IndicateursAtelier {
  const { maintenances, engins, pieces, alertes, maintenant } = sources;
  let aVenir = 0;
  let enRetard = 0;
  let sansDate = 0;
  for (const m of maintenances) {
    if (m.statut !== "PLANIFIEE") continue;
    const jours = joursAvantPrevue(m, maintenant);
    if (jours === null) sansDate += 1;
    else if (jours < 0) enRetard += 1;
    else if (jours <= HORIZON_PLANNING_JOURS) aVenir += 1;
  }
  const ouvertes = alertes.filter((a) => !a.traitee);
  return {
    enCours: maintenances.filter((m) => m.statut === "EN_COURS").length,
    aVenir,
    enRetard,
    sansDate,
    immobilises: engins.filter(estImmobilise).length,
    enPanne: engins.filter((e) => e.statut === "EN_PANNE").length,
    piecesStockBas: pieces.filter((p) => p.stockBas).length,
    piecesEnRupture: pieces.filter((p) => p.quantiteStock <= 0).length,
    alertes: ouvertes.length,
    alertesCritiques: ouvertes.filter((a) => a.priorite === "CRITIQUE").length,
  };
}

// ---------------------------------------------------------------- Planning

export type EtatPlanning = "en-retard" | "en-cours" | "a-venir" | "sans-date";

export interface LignePlanning {
  maintenance: Maintenance;
  etat: EtatPlanning;
  /** « En retard de 3 j », « Demain », « Depuis le 28/09/2026 »… */
  quand: string;
  vehicule: string;
  objet: string;
  lieu: string;
}

const RANG_ETAT: Record<EtatPlanning, number> = { "en-retard": 0, "en-cours": 1, "a-venir": 2, "sans-date": 3 };

function quandPrevue(jours: number): string {
  if (jours < 0) return `En retard de ${-jours} j`;
  if (jours === 0) return "Aujourd'hui";
  if (jours === 1) return "Demain";
  return `Dans ${jours} j`;
}

/** Objet lisible d'une maintenance : poste d'entretien, travaux, sinon type et description. */
export function objetMaintenance(m: Maintenance): string {
  if (m.libellePosteEntretien) return m.libellePosteEntretien;
  const travaux = (m.travaux ?? []).map((t) => t.libelle).filter(Boolean);
  if (travaux.length > 0) return travaux.join(", ");
  return [libelleEnum(m.type), m.description].filter(Boolean).join(" — ");
}

/**
 * Planning de l'atelier : en retard, en cours, prévues sous 7 jours, puis
 * planifiées sans date. Les maintenances prévues plus tard n'y sont pas.
 */
export function planningAtelier(maintenances: Maintenance[], maintenant: Date): LignePlanning[] {
  const lignes: LignePlanning[] = [];
  for (const m of maintenances) {
    let etat: EtatPlanning;
    let quand: string;
    if (m.statut === "EN_COURS") {
      etat = "en-cours";
      quand = m.dateDebut ? `Depuis le ${formatDate(m.dateDebut.slice(0, 10))}` : "En cours";
    } else if (m.statut === "PLANIFIEE") {
      const jours = joursAvantPrevue(m, maintenant);
      if (jours === null) {
        etat = "sans-date";
        quand = "Date à fixer";
      } else if (jours > HORIZON_PLANNING_JOURS) {
        continue;
      } else {
        etat = jours < 0 ? "en-retard" : "a-venir";
        quand = quandPrevue(jours);
      }
    } else {
      continue;
    }
    lignes.push({
      maintenance: m,
      etat,
      quand,
      vehicule: libelleVehicule(m.engin),
      objet: objetMaintenance(m),
      lieu: m.nomGarageExterne ?? "Atelier interne",
    });
  }
  const dateTri = (l: LignePlanning) => l.maintenance.datePrevue ?? l.maintenance.dateDebut ?? "9999";
  return lignes.sort((a, b) => RANG_ETAT[a.etat] - RANG_ETAT[b.etat] || dateTri(a).localeCompare(dateTri(b)));
}

// ---------------------------------------------------------------- Pièces

/** Pièces à réapprovisionner : ruptures d'abord, puis le stock le plus bas face au seuil. */
export function piecesAReapprovisionner(pieces: Piece[]): Piece[] {
  const ratio = (p: Piece) => (p.seuilAlerteStock > 0 ? p.quantiteStock / p.seuilAlerteStock : p.quantiteStock);
  return pieces.filter((p) => p.stockBas || p.quantiteStock <= 0).sort((a, b) => ratio(a) - ratio(b) || a.nom.localeCompare(b.nom));
}

// ---------------------------------------------------------------- À traiter

/**
 * Liste de travail de l'atelier : alertes critiques / élevées (déjà limitées
 * à l'atelier par le serveur), maintenances en retard, véhicules en panne
 * sans intervention prévue, pièces en rupture ou sous le seuil.
 */
export function aTraiterAtelier(sources: {
  maintenances: Maintenance[];
  engins: Engin[];
  pieces: Piece[];
  alertes: Alerte[];
  maintenant: Date;
}): ElementATraiter[] {
  const { maintenances, engins, pieces, alertes, maintenant } = sources;
  const elements = elementsAlertes(alertes);

  for (const m of maintenances) {
    const jours = joursAvantPrevue(m, maintenant);
    if (jours === null || jours >= 0) continue;
    elements.push({
      cle: `maintenance-retard-${m.idMaintenance}`,
      urgence: -jours > RETARD_CRITIQUE_JOURS ? "critique" : "elevee",
      categorie: "Maintenance",
      titre: `Maintenance en retard de ${-jours} j`,
      detail: `${identifiantVehicule(m.engin)} — ${objetMaintenance(m)} — prévue le ${formatDate(m.datePrevue!.slice(0, 10))}`,
      lien: "/maintenance",
      date: m.datePrevue!,
    });
  }

  const avecIntervention = new Set(
    maintenances.filter((m) => m.statut === "PLANIFIEE" || m.statut === "EN_COURS").map((m) => m.engin.idEngin),
  );
  for (const e of engins) {
    if (e.statut !== "EN_PANNE" || avecIntervention.has(e.idEngin)) continue;
    elements.push({
      cle: `panne-${e.idEngin}`,
      urgence: "elevee",
      categorie: "Véhicule",
      titre: "En panne, aucune intervention prévue",
      detail: libelleVehicule(e),
      lien: "/maintenance",
      date: "9999-12-31",
    });
  }

  for (const p of pieces) {
    if (p.quantiteStock > 0 && !p.stockBas) continue;
    const rupture = p.quantiteStock <= 0;
    elements.push({
      cle: `piece-${p.idPiece}`,
      urgence: rupture ? "elevee" : "moyenne",
      categorie: "Pièce",
      titre: rupture ? "Pièce en rupture de stock" : "Stock sous le seuil",
      detail: `${p.nom} (${p.reference}) — ${p.quantiteStock} en stock, seuil ${p.seuilAlerteStock}${p.nomFournisseur ? ` — ${p.nomFournisseur}` : ""}`,
      lien: "/maintenance?onglet=pieces",
      date: "9999-12-31",
    });
  }

  return trierATraiter(elements);
}
