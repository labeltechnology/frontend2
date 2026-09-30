import { grouperAlertes, libelleGroupe, rangPriorite } from "@/features/alertes/regroupement";
import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import { cheminHistorique } from "@/features/historique-engin/onglets";
import { formatDate, formatDateTime, libelleEnum } from "@/lib/utils";
import { identifiantVehicule, libelleVehicule } from "@/lib/vehicule";
import type { Alerte } from "@/types/alerte";
import type { Carburant } from "@/types/carburant";
import type { Document } from "@/types/document";
import type { Engin } from "@/types/engin";
import type { Incident } from "@/types/incident";
import type { Maintenance } from "@/types/maintenance";
import type { Mission } from "@/types/mission";

/**
 * Calculs du tableau de bord (refonte du 2026-09-25, « vérifier et faire une
 * conception professionnelle et ergonomique »). Fonctions pures, sans React :
 * testables seules. Les composants de features/dashboard/sections ne font
 * qu'afficher ce qui est calculé ici.
 */

const MS_JOUR = 86_400_000;

function jourLocal(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Jours entre aujourd'hui et une date ISO (négatif = passé). */
export function joursAvant(dateIso: string, aujourdhui: Date): number {
  const [a, m, j] = dateIso.slice(0, 10).split("-").map(Number);
  return Math.round((Date.UTC(a, m - 1, j) - jourLocal(aujourdhui)) / MS_JOUR);
}

// ---------------------------------------------------------------- Indicateurs

export interface Indicateurs {
  totalVehicules: number;
  disponibles: number;
  pctDisponibles: number;
  missionsEnCours: number;
  missionsEnRetard: number;
  maintenancesEnCours: number;
  enPanne: number;
  alertes: number;
  alertesCritiques: number;
  incidentsOuverts: number;
  incidentsGraves: number;
}

export function calculerIndicateurs(sources: {
  engins: Engin[];
  missions: Mission[];
  maintenances: Maintenance[];
  alertes: Alerte[];
  incidents: Incident[];
  maintenant: Date;
}): Indicateurs {
  const { engins, missions, maintenances, alertes, incidents, maintenant } = sources;
  const disponibles = engins.filter((e) => e.statut === "DISPONIBLE").length;
  const enCours = missions.filter((m) => m.statut === "EN_COURS");
  const ouverts = incidents.filter(estIncidentOuvert);
  return {
    totalVehicules: engins.length,
    disponibles,
    pctDisponibles: engins.length ? Math.round((disponibles / engins.length) * 100) : 0,
    missionsEnCours: enCours.length,
    missionsEnRetard: enCours.filter((m) => new Date(m.dateFinPrevue).getTime() < maintenant.getTime()).length,
    maintenancesEnCours: maintenances.filter((m) => m.statut === "EN_COURS").length,
    enPanne: engins.filter((e) => e.statut === "EN_PANNE").length,
    alertes: alertes.filter((a) => !a.traitee).length,
    alertesCritiques: alertes.filter((a) => !a.traitee && a.priorite === "CRITIQUE").length,
    incidentsOuverts: ouverts.length,
    incidentsGraves: ouverts.filter((i) => i.gravite === "ELEVEE" || i.gravite === "CRITIQUE").length,
  };
}

export function estIncidentOuvert(incident: Incident): boolean {
  return incident.statut === "DECLARE" || incident.statut === "EN_TRAITEMENT";
}

// ---------------------------------------------------------------- À traiter

export type Urgence = "critique" | "elevee" | "moyenne";

export interface ElementATraiter {
  cle: string;
  urgence: Urgence;
  /** Tableaux de bord par métier (2026-09-30) : atelier, finances, chantier ajoutent leurs catégories. */
  categorie:
    | "Alerte"
    | "Incident"
    | "Document"
    | "Mission"
    | "Véhicule"
    | "Maintenance"
    | "Pièce"
    | "Facture"
    | "Contrat"
    | "Chantier"
    | "Demande";
  titre: string;
  detail: string;
  lien: string;
  /** Date de référence pour trier à urgence égale (plus ancien d'abord). */
  date: string;
}

const RANG_URGENCE: Record<Urgence, number> = { critique: 0, elevee: 1, moyenne: 2 };
export const SEUIL_DOCUMENT_JOURS = 30;

/**
 * Alertes critiques et élevées non traitées, une ligne par groupe : alertes
 * répétées regroupées (même cible, même type — 2026-09-28), un GPS qui alerte
 * toutes les 15 min donne UNE ligne « ×96 depuis le … ». Partagé par tous les
 * tableaux de bord (le serveur ne renvoie que les alertes du métier).
 */
export function elementsAlertes(alertes: Alerte[]): ElementATraiter[] {
  const elements: ElementATraiter[] = [];
  for (const g of grouperAlertes(alertes.filter((a) => !a.traitee))) {
    if (rangPriorite(g.prioriteMax) < rangPriorite("ELEVEE")) continue;
    const repetition = g.nombre > 1 ? `depuis le ${formatDateTime(g.premiere)}, dernière : ` : "";
    elements.push({
      cle: `alerte-${g.cle}`,
      urgence: g.prioriteMax === "CRITIQUE" ? "critique" : "elevee",
      categorie: "Alerte",
      titre: libelleGroupe(g),
      detail: [g.libelleCible, `${repetition}${g.description}`].filter(Boolean).join(" — "),
      lien: "/alertes",
      date: g.premiere,
    });
  }
  return elements;
}

/** Tri commun des listes « À traiter » : urgence, puis date (plus ancien d'abord). */
export function trierATraiter(elements: ElementATraiter[]): ElementATraiter[] {
  return elements.sort((a, b) => RANG_URGENCE[a.urgence] - RANG_URGENCE[b.urgence] || a.date.localeCompare(b.date));
}

/**
 * Tout ce qui demande une action, du plus urgent au moins urgent :
 * alertes critiques / élevées non traitées, incidents ouverts, documents
 * expirés ou qui expirent sous 30 jours, missions dont le retour est
 * dépassé, véhicules en panne. Chaque élément mène à la page où le traiter.
 */
export function elementsATraiter(sources: {
  engins: Engin[];
  missions: Mission[];
  alertes: Alerte[];
  incidents: Incident[];
  documents: Document[];
  maintenant: Date;
}): ElementATraiter[] {
  const { engins, missions, alertes, incidents, documents, maintenant } = sources;
  const elements: ElementATraiter[] = elementsAlertes(alertes);

  for (const i of incidents) {
    if (!estIncidentOuvert(i)) continue;
    elements.push({
      cle: `incident-${i.idIncident}`,
      urgence: i.gravite === "CRITIQUE" ? "critique" : i.gravite === "ELEVEE" ? "elevee" : "moyenne",
      categorie: "Incident",
      titre: `${libelleEnum(i.type)} — ${i.statut === "DECLARE" ? "déclaré" : "en traitement"}`,
      detail: `${identifiantVehicule(i.engin)} — ${i.description}`,
      lien: cheminHistorique(i.engin.idEngin, "incidents"),
      date: i.dateSurvenue,
    });
  }

  for (const d of documents) {
    if (!d.actif || !d.dateExpiration) continue;
    const jours = joursAvant(d.dateExpiration, maintenant);
    if (jours > SEUIL_DOCUMENT_JOURS) continue;
    const porteur = d.engin ? identifiantVehicule(d.engin) : d.conducteur ? `${d.conducteur.prenom} ${d.conducteur.nom}` : "";
    elements.push({
      cle: `document-${d.idDocument}`,
      urgence: jours < 0 ? "critique" : jours <= 7 ? "elevee" : "moyenne",
      categorie: "Document",
      titre: `${LIBELLES_TYPE_DOCUMENT[d.type]} ${jours < 0 ? "expiré" : "à renouveler"}`,
      detail: `${porteur} — ${jours < 0 ? "expiré depuis le" : "expire le"} ${formatDate(d.dateExpiration.slice(0, 10))}`,
      lien: d.engin ? cheminHistorique(d.engin.idEngin, "documents") : "/documents",
      date: d.dateExpiration,
    });
  }

  for (const m of missions) {
    if (m.statut !== "EN_COURS" || new Date(m.dateFinPrevue).getTime() >= maintenant.getTime()) continue;
    elements.push({
      cle: `mission-${m.idMission}`,
      urgence: "elevee",
      categorie: "Mission",
      titre: "Retour de mission dépassé",
      detail: `${identifiantVehicule(m.engin)} — ${m.motif} — retour prévu le ${formatDate(m.dateFinPrevue.slice(0, 10))}`,
      lien: "/missions",
      date: m.dateFinPrevue,
    });
  }

  for (const e of engins) {
    if (e.statut !== "EN_PANNE") continue;
    elements.push({
      cle: `panne-${e.idEngin}`,
      urgence: "elevee",
      categorie: "Véhicule",
      titre: "Véhicule en panne",
      detail: libelleVehicule(e),
      lien: `/engins/${e.idEngin}/rapport`,
      // Pas de date de panne connue : après les éléments datés de même urgence.
      date: "9999-12-31",
    });
  }

  return trierATraiter(elements);
}

// ---------------------------------------------------------------- Missions en cours

export interface MissionSuivie {
  mission: Mission;
  progression: number;
  enRetard: boolean;
}

/** Progression temporelle (0-100) entre le début et la fin prévus. */
export function progressionMission(mission: Mission, maintenant: Date): number {
  const debut = new Date(mission.dateDebutReelle ?? mission.dateDebutPrevue).getTime();
  const fin = new Date(mission.dateFinPrevue).getTime();
  const t = maintenant.getTime();
  if (Number.isNaN(debut) || Number.isNaN(fin) || fin <= debut) return t >= fin ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round(((t - debut) / (fin - debut)) * 100)));
}

/** Missions en cours, les retards d'abord, puis par retour prévu le plus proche. */
export function missionsSuivies(missions: Mission[], maintenant: Date): MissionSuivie[] {
  return missions
    .filter((m) => m.statut === "EN_COURS")
    .map((mission) => ({
      mission,
      progression: progressionMission(mission, maintenant),
      enRetard: new Date(mission.dateFinPrevue).getTime() < maintenant.getTime(),
    }))
    .sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || a.mission.dateFinPrevue.localeCompare(b.mission.dateFinPrevue));
}

// ---------------------------------------------------------------- Carburant du mois

export interface SemaineCarburant {
  libelle: string;
  montant: number;
  litres: number;
}

export interface CarburantMois {
  montant: number;
  litres: number;
  pleins: number;
  semaines: SemaineCarburant[];
}

/** Pleins du mois en cours : totaux et découpage en semaines du mois (1-7, 8-14, 15-21, 22-28, 29+). */
export function carburantDuMois(pleins: Carburant[], aujourdhui: Date): CarburantMois {
  const prefixe = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}`;
  const joursDansMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0).getDate();
  const nbSemaines = Math.ceil(joursDansMois / 7);
  const semaines: SemaineCarburant[] = Array.from({ length: nbSemaines }, (_, i) => ({
    libelle: `${i * 7 + 1}–${Math.min((i + 1) * 7, joursDansMois)}`,
    montant: 0,
    litres: 0,
  }));
  let montant = 0;
  let litres = 0;
  let nombre = 0;
  for (const p of pleins) {
    if (!p.dateHeure.startsWith(prefixe)) continue;
    const jour = Number(p.dateHeure.slice(8, 10));
    const s = semaines[Math.min(Math.floor((jour - 1) / 7), nbSemaines - 1)];
    s.montant += p.montantTotal;
    s.litres += p.quantiteLitres;
    montant += p.montantTotal;
    litres += p.quantiteLitres;
    nombre += 1;
  }
  return { montant, litres, pleins: nombre, semaines };
}
