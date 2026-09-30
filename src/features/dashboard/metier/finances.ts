import { joursAvant, trierATraiter, type ElementATraiter } from "@/features/dashboard/indicateurs";
import { formatDate, formatMontant } from "@/lib/utils";
import { identifiantVehicule } from "@/lib/vehicule";
import type { ContratLocationExterne, FactureLocation } from "@/types/location";
import type { ContratLocationEntrante, FactureLocationEntrante } from "@/types/location-entrante";
import type { FactureGarage, Maintenance } from "@/types/maintenance";

/**
 * Tableau de bord des finances (pages par métier, 2026-09-30) — comptable :
 * dépenses du mois, factures à régler et à encaisser, contrats de location.
 * Calculs purs, sans React (testés seuls) ; TableauBordFinances affiche.
 */

/** Une facture non réglée depuis plus longtemps que ce délai est à relancer. */
export const DELAI_RELANCE_JOURS = 30;
/** Contrats dont la fin prévue tombe dans ce délai : à renouveler ou à clore. */
export const HORIZON_CONTRATS_JOURS = 30;

function prefixeMois(aujourdhui: Date): string {
  return `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}`;
}

export interface MaintenanceMois {
  montant: number;
  interventions: number;
  /** Dont garages externes. */
  montantExterne: number;
}

/** Maintenances terminées ce mois-ci : coût figé à la clôture (à défaut, coût calculé). */
export function maintenanceDuMois(maintenances: Maintenance[], aujourdhui: Date): MaintenanceMois {
  const prefixe = prefixeMois(aujourdhui);
  let montant = 0;
  let montantExterne = 0;
  let interventions = 0;
  for (const m of maintenances) {
    if (m.statut !== "TERMINEE" || !m.dateFin?.startsWith(prefixe)) continue;
    const cout = m.coutTotal ?? m.coutCalcule ?? 0;
    montant += cout;
    if (m.idGarageExterne !== null) montantExterne += cout;
    interventions += 1;
  }
  return { montant, interventions, montantExterne };
}

// ---------------------------------------------------------------- Factures en attente

/** « A_PAYER » : l'entreprise doit (garage, prestataire) ; « A_ENCAISSER » : un client doit. */
export type SensFacture = "A_PAYER" | "A_ENCAISSER";

export interface FactureEnAttente {
  cle: string;
  sens: SensFacture;
  origine: "Garage" | "Location reçue" | "Location facturée";
  reference: string;
  tiers: string;
  montant: number;
  dateEmission: string;
  /** Jours écoulés depuis l'émission. */
  anciennete: number;
  lien: string;
}

export function facturesEnAttente(
  sources: {
    garage: FactureGarage[];
    locationsRecues: FactureLocationEntrante[];
    locationsEmises: FactureLocation[];
  },
  aujourdhui: Date,
): FactureEnAttente[] {
  const lignes: FactureEnAttente[] = [];
  const anciennete = (d: string) => Math.max(0, -joursAvant(d, aujourdhui));
  for (const f of sources.garage) {
    if (f.statut !== "EMISE") continue;
    lignes.push({
      cle: `garage-${f.idFactureGarage}`,
      sens: "A_PAYER",
      origine: "Garage",
      reference: f.reference,
      tiers: f.maintenance.nomGarageExterne ?? "Garage externe",
      montant: f.montant,
      dateEmission: f.dateEmission,
      anciennete: anciennete(f.dateEmission),
      lien: "/garages-externes",
    });
  }
  for (const f of sources.locationsRecues) {
    if (f.statut !== "EMISE") continue;
    lignes.push({
      cle: `location-recue-${f.idFactureLocationEntrante}`,
      sens: "A_PAYER",
      origine: "Location reçue",
      reference: f.reference,
      tiers: f.contrat.nomPrestataire,
      montant: f.montant,
      dateEmission: f.dateEmission,
      anciennete: anciennete(f.dateEmission),
      lien: "/locations-entrantes",
    });
  }
  for (const f of sources.locationsEmises) {
    if (f.statut !== "EMISE") continue;
    lignes.push({
      cle: `location-emise-${f.idFactureLocation}`,
      sens: "A_ENCAISSER",
      origine: "Location facturée",
      reference: f.reference,
      tiers: f.contrat.nomSociete,
      montant: f.montantTtc,
      dateEmission: f.dateEmission,
      anciennete: anciennete(f.dateEmission),
      lien: "/locations-externes",
    });
  }
  // Les plus anciennes d'abord : ce sont celles à relancer ou à régler.
  return lignes.sort((a, b) => b.anciennete - a.anciennete || b.montant - a.montant);
}

export function totalParSens(factures: FactureEnAttente[], sens: SensFacture): { nombre: number; montant: number } {
  const du = factures.filter((f) => f.sens === sens);
  return { nombre: du.length, montant: du.reduce((s, f) => s + f.montant, 0) };
}

// ---------------------------------------------------------------- Contrats

export interface EcheanceContrat {
  cle: string;
  sens: "Loué à un client" | "Pris en location";
  tiers: string;
  vehicule: string;
  reference: string | null;
  dateFinPrevue: string;
  /** Jours avant la fin prévue (négatif = dépassée, contrat toujours actif). */
  jours: number;
  tarifJournalier: number | null;
  lien: string;
}

/** Contrats actifs dont la fin prévue est dépassée ou tombe dans les 30 jours. */
export function echeancesContrats(
  sources: { sortants: ContratLocationExterne[]; entrants: ContratLocationEntrante[] },
  aujourdhui: Date,
): EcheanceContrat[] {
  const lignes: EcheanceContrat[] = [];
  for (const c of sources.sortants) {
    if (c.statut !== "ACTIF" || !c.dateFinPrevue) continue;
    const jours = joursAvant(c.dateFinPrevue, aujourdhui);
    if (jours > HORIZON_CONTRATS_JOURS) continue;
    lignes.push({
      cle: `sortant-${c.idContratLocationExterne}`,
      sens: "Loué à un client",
      tiers: c.nomSociete,
      vehicule: identifiantVehicule(c.engin),
      reference: c.referenceContrat,
      dateFinPrevue: c.dateFinPrevue,
      jours,
      tarifJournalier: c.tarifJournalier,
      lien: "/locations-externes",
    });
  }
  for (const c of sources.entrants) {
    if (c.statut !== "ACTIF" || !c.dateFinPrevue) continue;
    const jours = joursAvant(c.dateFinPrevue, aujourdhui);
    if (jours > HORIZON_CONTRATS_JOURS) continue;
    lignes.push({
      cle: `entrant-${c.idContratLocationEntrante}`,
      sens: "Pris en location",
      tiers: c.nomPrestataire,
      vehicule: identifiantVehicule(c.engin),
      reference: c.referenceContrat,
      dateFinPrevue: c.dateFinPrevue,
      jours,
      tarifJournalier: c.tarifJournalier,
      lien: "/locations-entrantes",
    });
  }
  return lignes.sort((a, b) => a.jours - b.jours);
}

export function contratsActifs(sources: { sortants: ContratLocationExterne[]; entrants: ContratLocationEntrante[] }): {
  sortants: number;
  entrants: number;
} {
  return {
    sortants: sources.sortants.filter((c) => c.statut === "ACTIF").length,
    entrants: sources.entrants.filter((c) => c.statut === "ACTIF").length,
  };
}

// ---------------------------------------------------------------- À traiter

/**
 * Liste de travail du comptable : factures non réglées depuis plus de 30
 * jours, contrats de location dépassés ou qui se terminent, interventions de
 * garage terminées sans facture. `facturesGarage` null (non chargées) : ce
 * dernier contrôle est sauté plutôt que de tout signaler à tort.
 */
export function aTraiterFinances(sources: {
  factures: FactureEnAttente[];
  echeances: EcheanceContrat[];
  maintenances: Maintenance[];
  facturesGarage: FactureGarage[] | null;
  aujourdhui: Date;
}): ElementATraiter[] {
  const elements: ElementATraiter[] = [];

  for (const f of sources.factures) {
    if (f.anciennete <= DELAI_RELANCE_JOURS) continue;
    const payer = f.sens === "A_PAYER";
    elements.push({
      cle: `facture-${f.cle}`,
      urgence: f.anciennete > 2 * DELAI_RELANCE_JOURS ? "critique" : "elevee",
      categorie: "Facture",
      titre: payer ? `Facture à régler depuis ${f.anciennete} j` : `Facture à encaisser depuis ${f.anciennete} j`,
      detail: `${f.reference} — ${f.tiers} — ${formatMontant(f.montant)}`,
      lien: f.lien,
      date: f.dateEmission,
    });
  }

  for (const c of sources.echeances) {
    elements.push({
      cle: `contrat-${c.cle}`,
      urgence: c.jours < 0 ? "critique" : c.jours <= 7 ? "elevee" : "moyenne",
      categorie: "Contrat",
      titre: c.jours < 0 ? "Contrat de location dépassé" : "Contrat de location à échéance",
      detail: `${c.tiers} — ${c.vehicule} — fin prévue le ${formatDate(c.dateFinPrevue.slice(0, 10))}`,
      lien: c.lien,
      date: c.dateFinPrevue,
    });
  }

  if (sources.facturesGarage) {
    const facturees = new Set(
      sources.facturesGarage.filter((f) => f.statut !== "ANNULEE").map((f) => f.maintenance.idMaintenance),
    );
    for (const m of sources.maintenances) {
      if (m.statut !== "TERMINEE" || m.idGarageExterne === null || facturees.has(m.idMaintenance)) continue;
      elements.push({
        cle: `non-facturee-${m.idMaintenance}`,
        urgence: "moyenne",
        categorie: "Maintenance",
        titre: "Intervention de garage sans facture",
        detail: `${m.nomGarageExterne ?? "Garage externe"} — ${identifiantVehicule(m.engin)}${m.dateFin ? ` — terminée le ${formatDate(m.dateFin.slice(0, 10))}` : ""}`,
        lien: "/garages-externes",
        date: m.dateFin ?? "9999-12-31",
      });
    }
  }

  return trierATraiter(elements);
}
