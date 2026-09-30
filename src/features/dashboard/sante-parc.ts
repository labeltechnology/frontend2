import { blocIncidents } from "@/features/rapport-engin/bloc-incidents";
import { blocAlertes, blocDocuments } from "@/features/rapport-engin/construire-rapport";
import { comparerGravite, niveauLePlusGrave, type LigneRapport, type NiveauRapport } from "@/features/rapport-engin/niveaux";
import { comparerVehicules } from "@/lib/vehicule";
import type { Alerte } from "@/types/alerte";
import type { Document } from "@/types/document";
import type { Engin, StatutEngin } from "@/types/engin";
import type { Incident } from "@/types/incident";
import type { Maintenance } from "@/types/maintenance";

/**
 * « Mur du parc » du tableau de bord (2026-09-25, demande : « détailler le
 * statut du parc par véhicule ou trouver un meilleur concept pour mieux
 * interpréter »). Concept validé : une tuile par véhicule, rangée sous son
 * statut, colorée selon son état de santé.
 *
 * Deux lectures distinctes :
 *  - le STATUT dit si le véhicule est utilisable maintenant (disponible, en
 *    mission, affecté) ou immobilisé (maintenance, panne) ;
 *  - la SANTÉ dit s'il est en règle, sur 4 dimensions : documents, alertes,
 *    incidents ouverts, atelier (panne / maintenance).
 *
 * Les règles de couleur sont celles du rapport véhicule (mêmes fonctions :
 * blocDocuments, blocAlertes, blocIncidents), donc une tuile rouge
 * correspond toujours à une carte rouge dans le rapport. L'entretien
 * périodique et la sécurité / boîte à outils n'y sont pas : le serveur ne les
 * expose que véhicule par véhicule (une requête par véhicule serait trop
 * lourde pour le tableau de bord).
 *
 * Logique pure (sans React ni réseau) ; `aujourdhui` est un paramètre.
 */

export type DimensionSante = "documents" | "alertes" | "incidents" | "atelier";

export const DIMENSIONS_SANTE: { cle: DimensionSante; libelle: string }[] = [
  { cle: "documents", libelle: "Documents" },
  { cle: "alertes", libelle: "Alertes" },
  { cle: "incidents", libelle: "Incidents" },
  { cle: "atelier", libelle: "Atelier" },
];

/** Statuts affichés, dans l'ordre des groupes ; réformés et vendus sont hors parc. */
export const GROUPES_STATUT: { statut: StatutEngin; libelle: string; utilisable: boolean }[] = [
  { statut: "DISPONIBLE", libelle: "Disponible", utilisable: true },
  { statut: "EN_MISSION", libelle: "En mission", utilisable: true },
  { statut: "AFFECTE", libelle: "Affecté", utilisable: true },
  { statut: "EN_MAINTENANCE", libelle: "En maintenance", utilisable: false },
  { statut: "EN_PANNE", libelle: "En panne", utilisable: false },
];

export interface EtatDimension {
  niveau: NiveauRapport;
  /** Ligne la plus grave, « Assurance : Expiré le 01/09/2026 » ; null si rien à signaler. */
  motif: string | null;
}

export interface SanteVehicule {
  engin: Engin;
  dimensions: Record<DimensionSante, EtatDimension>;
  /** Niveau le plus grave des dimensions connues (une source indisponible ne grise pas la tuile). */
  niveau: NiveauRapport;
  /** Motif de la dimension la plus grave ; null quand tout est OK. */
  motif: string | null;
}

export interface GroupeSante {
  statut: StatutEngin;
  libelle: string;
  vehicules: SanteVehicule[];
}

export interface SanteParc {
  groupes: GroupeSante[];
  /** Véhicules du parc actif (hors réformés et vendus). */
  actifs: number;
  utilisables: number;
  immobilises: number;
  enAlerte: number;
  aSurveiller: number;
  /** Réformés et vendus, non affichés. */
  horsParc: number;
  /** Dimensions dont la source est indisponible (droits, réseau). */
  dimensionsIndisponibles: DimensionSante[];
}

/** Sources déjà chargées par le tableau de bord ; `null` = indisponible. */
export interface SourcesSanteParc {
  engins: Engin[];
  documents: Document[] | null;
  alertes: Alerte[] | null;
  maintenances: Maintenance[] | null;
  incidents: Incident[] | null;
  aujourdhui: Date;
}

const INDISPONIBLE: EtatDimension = { niveau: "inconnu", motif: "Données indisponibles" };

function etatDepuisLignes(lignes: LigneRapport[], siVide: NiveauRapport): EtatDimension {
  const niveau = niveauLePlusGrave(
    lignes.map((l) => l.niveau),
    siVide,
  );
  const pire = [...lignes].sort((a, b) => comparerGravite(b.niveau, a.niveau))[0];
  return { niveau, motif: pire && niveau !== "ok" ? `${pire.libelle} : ${pire.detail}` : null };
}

export function santeVehicule(engin: Engin, sources: Omit<SourcesSanteParc, "engins">): SanteVehicule {
  const { aujourdhui } = sources;
  const base = { engin, aujourdhui, echeances: null, equipements: null };

  const documents =
    sources.documents === null
      ? INDISPONIBLE
      : etatDepuisLignes(blocDocuments({ ...base, documents: sources.documents, alertes: null, maintenances: null }).lignes, "ok");

  // La carte « Alertes et maintenance » du rapport est scindée en deux
  // pastilles : alertes (lignes « alerte-… ») et atelier (panne, maintenances).
  const lignesAlertes = blocAlertes({ ...base, documents: null, alertes: sources.alertes, maintenances: sources.maintenances }).lignes;
  const alertes =
    sources.alertes === null ? INDISPONIBLE : etatDepuisLignes(lignesAlertes.filter((l) => l.cle.startsWith("alerte-")), "ok");
  const lignesAtelier = lignesAlertes.filter((l) => l.cle === "panne" || l.cle.startsWith("maintenance-"));
  if (engin.statut === "EN_PANNE" && !lignesAtelier.some((l) => l.cle === "panne")) {
    lignesAtelier.unshift({ cle: "panne", libelle: "Véhicule en panne", niveau: "alerte", detail: "Statut actuel du véhicule" });
  }
  // Statut « en maintenance » sans maintenance en cours visible (droits, saisie oubliée) : jaune quand même.
  if (engin.statut === "EN_MAINTENANCE" && !lignesAtelier.some((l) => l.niveau !== "ok")) {
    lignesAtelier.unshift({ cle: "statut-maintenance", libelle: "En maintenance", niveau: "avertissement", detail: "Statut actuel du véhicule" });
  }
  const atelier =
    sources.maintenances === null && lignesAtelier.length === 0 ? INDISPONIBLE : etatDepuisLignes(lignesAtelier, "ok");

  const incidents =
    sources.incidents === null
      ? INDISPONIBLE
      : etatDepuisLignes(blocIncidents({ engin, incidents: sources.incidents }).lignes, "ok");

  const dimensions: Record<DimensionSante, EtatDimension> = { documents, alertes, incidents, atelier };
  const connues = DIMENSIONS_SANTE.map((d) => dimensions[d.cle]).filter((e) => e.niveau !== "inconnu");
  const niveau = niveauLePlusGrave(
    connues.map((e) => e.niveau),
    "inconnu",
  );
  const pire = [...connues].sort((a, b) => comparerGravite(b.niveau, a.niveau))[0];
  return { engin, dimensions, niveau, motif: pire && niveau !== "ok" ? pire.motif : null };
}

/** Véhicule qui demande une action : à surveiller (jaune) ou en alerte (rouge). */
export function estAProbleme(sante: SanteVehicule): boolean {
  return sante.niveau === "alerte" || sante.niveau === "avertissement";
}

/** Du plus grave au moins grave, puis par libellé. */
function comparerSante(a: SanteVehicule, b: SanteVehicule): number {
  return comparerGravite(b.niveau, a.niveau) || comparerVehicules(a.engin, b.engin);
}

export function santeParc(sources: SourcesSanteParc): SanteParc {
  const statutsAffiches = new Set(GROUPES_STATUT.map((g) => g.statut));
  const actifs = sources.engins.filter((e) => statutsAffiches.has(e.statut));
  const santes = actifs.map((e) => santeVehicule(e, sources));

  const groupes = GROUPES_STATUT.map(({ statut, libelle }) => ({
    statut,
    libelle,
    vehicules: santes.filter((s) => s.engin.statut === statut).sort(comparerSante),
  }));
  const utilisablesStatuts = new Set(GROUPES_STATUT.filter((g) => g.utilisable).map((g) => g.statut));
  const utilisables = actifs.filter((e) => utilisablesStatuts.has(e.statut)).length;

  const indisponibles: DimensionSante[] = [];
  if (sources.documents === null) indisponibles.push("documents");
  if (sources.alertes === null) indisponibles.push("alertes");
  if (sources.incidents === null) indisponibles.push("incidents");
  if (sources.maintenances === null) indisponibles.push("atelier");

  return {
    groupes,
    actifs: actifs.length,
    utilisables,
    immobilises: actifs.length - utilisables,
    enAlerte: santes.filter((s) => s.niveau === "alerte").length,
    aSurveiller: santes.filter((s) => s.niveau === "avertissement").length,
    horsParc: sources.engins.length - actifs.length,
    dimensionsIndisponibles: indisponibles,
  };
}
