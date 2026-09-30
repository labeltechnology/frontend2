import { normaliserTexte } from "@/features/engins/recherche-vehicules";
import { objetMaintenance } from "@/features/maintenance/objet-maintenance";
import { libelleVehicule } from "@/lib/vehicule";
import type { Maintenance, StatutMaintenance, TypeMaintenance } from "@/types/maintenance";

/**
 * Page Maintenance (2026-09-28, « améliorer la page maintenance ») :
 * libellés, filtres, tri, indicateurs, durée et coût affichés. Logique pure,
 * sans React : testable seule.
 */

export const LIBELLES_TYPE_MAINTENANCE: Record<TypeMaintenance, string> = {
  PREVENTIVE: "Préventive",
  CORRECTIVE: "Corrective",
};

export const LIBELLES_STATUT_MAINTENANCE: Record<StatutMaintenance, string> = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

export type FiltreStatut = "TOUTES" | StatutMaintenance | "EN_RETARD";
export type FiltreAtelier = "TOUS" | "INTERNE" | "GARAGE";

export interface FiltresMaintenance {
  statut: FiltreStatut;
  type: "TOUS" | TypeMaintenance;
  atelier: FiltreAtelier;
  recherche: string;
}

export const FILTRES_PAR_DEFAUT: FiltresMaintenance = { statut: "TOUTES", type: "TOUS", atelier: "TOUS", recherche: "" };

function jourLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Planifiée dont la date prévue est dépassée (jour strictement antérieur à aujourd'hui). */
export function estEnRetard(m: Pick<Maintenance, "statut" | "datePrevue">, aujourdhui: Date): boolean {
  return m.statut === "PLANIFIEE" && !!m.datePrevue && m.datePrevue.slice(0, 10) < jourLocal(aujourdhui);
}

function texteCherchable(m: Maintenance): string {
  return normaliserTexte(
    [
      libelleVehicule(m.engin),
      m.engin?.marque,
      m.engin?.modele,
      objetMaintenance(m),
      m.nomGarageExterne ?? "atelier interne",
      m.referenceFacture,
      LIBELLES_TYPE_MAINTENANCE[m.type],
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function filtrerMaintenances(maintenances: readonly Maintenance[], f: FiltresMaintenance, aujourdhui: Date): Maintenance[] {
  const mots = normaliserTexte(f.recherche).split(/\s+/).filter(Boolean);
  return maintenances.filter((m) => {
    if (f.statut === "EN_RETARD" ? !estEnRetard(m, aujourdhui) : f.statut !== "TOUTES" && m.statut !== f.statut) return false;
    if (f.type !== "TOUS" && m.type !== f.type) return false;
    if (f.atelier === "INTERNE" && m.idGarageExterne != null) return false;
    if (f.atelier === "GARAGE" && m.idGarageExterne == null) return false;
    if (mots.length > 0) {
      const texte = texteCherchable(m);
      if (!mots.every((mot) => texte.includes(mot))) return false;
    }
    return true;
  });
}

const RANG_STATUT: Record<StatutMaintenance, number> = { EN_COURS: 0, PLANIFIEE: 1, TERMINEE: 2 };

/**
 * En cours d'abord (la plus ancienne en tête : immobilisation la plus
 * longue), puis planifiées par date prévue (sans date à la fin), puis
 * terminées de la plus récente à la plus ancienne.
 */
export function trierMaintenances(maintenances: readonly Maintenance[]): Maintenance[] {
  const cle = (m: Maintenance): string => {
    if (m.statut === "EN_COURS") return m.dateDebut ?? "";
    if (m.statut === "PLANIFIEE") return m.datePrevue ?? "9999";
    return m.dateFin ?? "";
  };
  return [...maintenances].sort((a, b) => {
    const rang = RANG_STATUT[a.statut] - RANG_STATUT[b.statut];
    if (rang !== 0) return rang;
    const ordre = cle(a).localeCompare(cle(b));
    return a.statut === "TERMINEE" ? -ordre : ordre;
  });
}

export interface IndicateursMaintenance {
  planifiees: number;
  enRetard: number;
  enCours: number;
  /** Véhicules distincts immobilisés par une maintenance en cours. */
  vehiculesImmobilises: number;
  termineesCeMois: number;
  /** Somme des coûts des maintenances terminées ce mois-ci. */
  coutCeMois: number;
}

export function indicateursMaintenance(maintenances: readonly Maintenance[], aujourdhui: Date): IndicateursMaintenance {
  const mois = jourLocal(aujourdhui).slice(0, 7);
  const enCours = maintenances.filter((m) => m.statut === "EN_COURS");
  const terminees = maintenances.filter((m) => m.statut === "TERMINEE" && m.dateFin?.slice(0, 7) === mois);
  return {
    planifiees: maintenances.filter((m) => m.statut === "PLANIFIEE").length,
    enRetard: maintenances.filter((m) => estEnRetard(m, aujourdhui)).length,
    enCours: enCours.length,
    vehiculesImmobilises: new Set(enCours.map((m) => m.engin?.idEngin)).size,
    termineesCeMois: terminees.length,
    coutCeMois: terminees.reduce((s, m) => s + (m.coutTotal ?? m.coutCalcule ?? 0), 0),
  };
}

/** Durée d'immobilisation lisible (« 2 j 4 h », « 5 h ») ; null si pas démarrée. */
export function dureeImmobilisation(m: Pick<Maintenance, "dateDebut" | "dateFin">, maintenant: Date): string | null {
  if (!m.dateDebut) return null;
  const debut = new Date(m.dateDebut).getTime();
  const fin = m.dateFin ? new Date(m.dateFin).getTime() : maintenant.getTime();
  const heures = Math.max(0, Math.floor((fin - debut) / 3_600_000));
  if (heures < 1) return "< 1 h";
  const jours = Math.floor(heures / 24);
  const reste = heures % 24;
  if (jours === 0) return `${reste} h`;
  return reste === 0 ? `${jours} j` : `${jours} j ${reste} h`;
}

/** Coût à afficher : le coût figé à la clôture, sinon le coût calculé à l'instant (provisoire). */
export function coutAffiche(m: Pick<Maintenance, "coutTotal" | "coutCalcule" | "statut">): { montant: number | null; provisoire: boolean } {
  if (m.statut === "TERMINEE" && m.coutTotal != null) return { montant: m.coutTotal, provisoire: false };
  const montant = m.coutCalcule ?? m.coutTotal ?? null;
  return { montant: montant && montant > 0 ? montant : null, provisoire: true };
}
