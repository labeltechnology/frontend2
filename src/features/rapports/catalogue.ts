import type { TypeRapport } from "@/types/rapport";

/**
 * Catalogue des rapports (refonte de la page Rapports, 2026-09-28) : titre,
 * explication, famille et paramètres de chaque type. Source unique pour le
 * choix du type en cartes, le formulaire, la liste et les contrôles avant envoi
 * (le serveur refait les mêmes contrôles, RapportService.generer).
 * Les phrases reprennent CatalogueRapports.java (sous-titre du PDF).
 */

export type FamilleRapport = "SYNTHESES" | "ACTIVITE" | "FINANCES" | "PARC";

/** Ce que le rapport vise : un véhicule, un conducteur, un chantier, ou tout le parc (filtres facultatifs). */
export type CibleRapport = "VEHICULE" | "CONDUCTEUR" | "CHANTIER" | "AUCUNE";

export type ExigencePeriode = "OBLIGATOIRE" | "FACULTATIVE" | "SANS";

export interface DefinitionRapport {
  type: TypeRapport;
  titre: string;
  description: string;
  famille: FamilleRapport;
  /** Clé d'icône (voir icones-rapport.tsx). */
  icone: CleIconeRapport;
  /** Cible obligatoire ; AUCUNE = rapport sur tout le parc. */
  cible: CibleRapport;
  /** Filtres facultatifs proposés quand cible = AUCUNE. */
  filtres: ("VEHICULE" | "CONDUCTEUR")[];
  periode: ExigencePeriode;
}

export type CleIconeRapport =
  | "synthese"
  | "vehicule"
  | "conducteur"
  | "chantier"
  | "missions"
  | "maintenance"
  | "carburant"
  | "incidents"
  | "rentabilite"
  | "tresorerie"
  | "parc"
  | "documents"
  | "utilisation";

export const FAMILLES: { cle: FamilleRapport; libelle: string; description: string }[] = [
  { cle: "SYNTHESES", libelle: "Synthèses", description: "Plusieurs domaines réunis en un document." },
  { cle: "ACTIVITE", libelle: "Activité", description: "Missions, maintenance, carburant et incidents." },
  { cle: "FINANCES", libelle: "Finances", description: "Rentabilité et factures." },
  { cle: "PARC", libelle: "Parc et conformité", description: "État du parc, utilisation et documents." },
];

export const CATALOGUE: DefinitionRapport[] = [
  {
    type: "SYNTHESE_GENERALE",
    titre: "Synthèse générale",
    description: "Tous les domaines en un seul document : activité, coûts, incidents, documents, trésorerie et alertes.",
    famille: "SYNTHESES",
    icone: "synthese",
    cible: "AUCUNE",
    filtres: [],
    periode: "OBLIGATOIRE",
  },
  {
    type: "VEHICULE",
    titre: "Synthèse par véhicule",
    description: "Carburant, maintenance, missions et incidents d'un véhicule sur la période.",
    famille: "SYNTHESES",
    icone: "vehicule",
    cible: "VEHICULE",
    filtres: [],
    periode: "FACULTATIVE",
  },
  {
    type: "CONDUCTEUR",
    titre: "Synthèse par conducteur",
    description: "Missions, carburant et incidents d'un conducteur sur la période.",
    famille: "SYNTHESES",
    icone: "conducteur",
    cible: "CONDUCTEUR",
    filtres: [],
    periode: "FACULTATIVE",
  },
  {
    type: "CHANTIER",
    titre: "Rapport par chantier",
    description: "Véhicules rattachés à un chantier : rattachements de la période et présents aujourd'hui.",
    famille: "SYNTHESES",
    icone: "chantier",
    cible: "CHANTIER",
    filtres: [],
    periode: "FACULTATIVE",
  },
  {
    type: "MISSIONS",
    titre: "Missions",
    description: "Nombre de missions, missions terminées ou annulées et kilomètres parcourus.",
    famille: "ACTIVITE",
    icone: "missions",
    cible: "AUCUNE",
    filtres: ["VEHICULE", "CONDUCTEUR"],
    periode: "FACULTATIVE",
  },
  {
    type: "MAINTENANCE",
    titre: "Maintenance",
    description: "Nombre d'interventions et coût total de la maintenance.",
    famille: "ACTIVITE",
    icone: "maintenance",
    cible: "AUCUNE",
    filtres: ["VEHICULE"],
    periode: "FACULTATIVE",
  },
  {
    type: "CARBURANT",
    titre: "Carburant",
    description: "Pleins, litres consommés et dépense en carburant.",
    famille: "ACTIVITE",
    icone: "carburant",
    cible: "AUCUNE",
    filtres: ["VEHICULE", "CONDUCTEUR"],
    periode: "FACULTATIVE",
  },
  {
    type: "INCIDENTS",
    titre: "Incidents",
    description: "Incidents déclarés, incidents critiques et coût estimé.",
    famille: "ACTIVITE",
    icone: "incidents",
    cible: "AUCUNE",
    filtres: ["VEHICULE", "CONDUCTEUR"],
    periode: "FACULTATIVE",
  },
  {
    type: "INCIDENTS_RECAPITULATIF",
    titre: "Récapitulatif des incidents",
    description: "Incidents et accidents par gravité et par type, véhicules les plus touchés.",
    famille: "ACTIVITE",
    icone: "incidents",
    cible: "AUCUNE",
    filtres: [],
    periode: "FACULTATIVE",
  },
  {
    type: "RENTABILITE",
    titre: "Rentabilité par véhicule",
    description: "Revenus de location d'un véhicule moins ses charges (carburant et maintenance).",
    famille: "FINANCES",
    icone: "rentabilite",
    cible: "VEHICULE",
    filtres: [],
    periode: "FACULTATIVE",
  },
  {
    type: "TRESORERIE",
    titre: "Trésorerie",
    description: "Factures émises et reçues en attente de paiement, dont celles en retard de plus de 30 jours.",
    famille: "FINANCES",
    icone: "tresorerie",
    cible: "AUCUNE",
    filtres: [],
    periode: "SANS",
  },
  {
    type: "PARC",
    titre: "État du parc",
    description: "Photo du parc aujourd'hui : nombre de véhicules et répartition par statut.",
    famille: "PARC",
    icone: "parc",
    cible: "AUCUNE",
    filtres: [],
    periode: "SANS",
  },
  {
    type: "COUTS_RENTABILITE",
    titre: "Coûts et rentabilité (TCO)",
    description: "Coût complet (TCO) par véhicule et par type, véhicules à surveiller ou à remplacer, budget carburant et score de conduite.",
    famille: "FINANCES",
    icone: "rentabilite",
    cible: "AUCUNE",
    filtres: [],
    periode: "OBLIGATOIRE",
  },
  {
    type: "SINISTRALITE",
    titre: "Sinistralité",
    description: "Sinistres de la période : dommages, franchises, indemnisations et reste à charge, par responsabilité, véhicule et conducteur.",
    famille: "FINANCES",
    icone: "incidents",
    cible: "AUCUNE",
    filtres: [],
    periode: "OBLIGATOIRE",
  },
  {
    type: "FIABILITE_CONFORMITE",
    titre: "Maintenance, fiabilité et conformité",
    description: "Disponibilité, immobilisations et leur coût, temps entre pannes, délai de réparation, contrôle qualité, respect du planning d'entretien et conformité.",
    famille: "PARC",
    icone: "maintenance",
    cible: "AUCUNE",
    filtres: [],
    periode: "OBLIGATOIRE",
  },
  {
    type: "RENOUVELLEMENT",
    titre: "Renouvellement du parc",
    description: "Plan de renouvellement, âge moyen et mode d'acquisition, besoins futurs, part électrique et fin de vie des véhicules.",
    famille: "PARC",
    icone: "parc",
    cible: "AUCUNE",
    filtres: [],
    periode: "SANS",
  },
  {
    type: "PERFORMANCE_UTILISATION",
    titre: "Performance et utilisation",
    description: "Taux d'utilisation réel, véhicules sous-utilisés ou en trop, coût par km et par heure comparé à la référence, KPI du parc.",
    famille: "PARC",
    icone: "utilisation",
    cible: "AUCUNE",
    filtres: [],
    periode: "OBLIGATOIRE",
  },
  {
    type: "UTILISATION_PARC",
    titre: "Taux d'utilisation du parc",
    description: "Part du temps où les véhicules ont été en mission sur la période.",
    famille: "PARC",
    icone: "utilisation",
    cible: "AUCUNE",
    filtres: [],
    periode: "OBLIGATOIRE",
  },
  {
    type: "DOCUMENTS_A_EXPIRER",
    titre: "Documents à expirer",
    description: "Documents expirés ou arrivant à échéance dans les 30 jours.",
    famille: "PARC",
    icone: "documents",
    cible: "AUCUNE",
    filtres: [],
    periode: "SANS",
  },
];

const PAR_TYPE = new Map(CATALOGUE.map((d) => [d.type, d]));

export function definitionRapport(type: TypeRapport): DefinitionRapport {
  const definition = PAR_TYPE.get(type);
  if (!definition) throw new Error(`Type de rapport inconnu : ${type}`);
  return definition;
}

export function rapportsDeLaFamille(famille: FamilleRapport): DefinitionRapport[] {
  return CATALOGUE.filter((d) => d.famille === famille);
}

/** Paramètres saisis dans le formulaire (identifiants en texte, comme les Select). */
export interface ParametresRapport {
  dateDebutPeriode: string;
  dateFinPeriode: string;
  idEngin: string;
  idConducteur: string;
  idChantier: string;
}

export const PARAMETRES_VIDES: ParametresRapport = {
  dateDebutPeriode: "",
  dateFinPeriode: "",
  idEngin: "",
  idConducteur: "",
  idChantier: "",
};

/** Premier problème bloquant, ou null si le rapport peut être généré. */
export function validerParametres(type: TypeRapport, p: ParametresRapport): string | null {
  const def = definitionRapport(type);
  if (def.cible === "VEHICULE" && !p.idEngin) return "Choisissez le véhicule.";
  if (def.cible === "CONDUCTEUR" && !p.idConducteur) return "Choisissez le conducteur.";
  if (def.cible === "CHANTIER" && !p.idChantier) return "Choisissez le chantier.";
  if (def.periode === "OBLIGATOIRE" && (!p.dateDebutPeriode || !p.dateFinPeriode)) {
    return "Indiquez le début et la fin de la période.";
  }
  if (p.dateDebutPeriode && p.dateFinPeriode && p.dateDebutPeriode > p.dateFinPeriode) {
    return "La fin de la période est avant son début.";
  }
  return null;
}

/**
 * Requête envoyée au serveur : seuls les champs utiles au type sont transmis
 * (un véhicule choisi puis devenu hors sujet après un changement de type n'est
 * pas envoyé en silence).
 */
export function requeteGeneration(type: TypeRapport, p: ParametresRapport) {
  const def = definitionRapport(type);
  const avecPeriode = def.periode !== "SANS";
  const vehicule = def.cible === "VEHICULE" || (def.cible === "AUCUNE" && def.filtres.includes("VEHICULE"));
  const conducteur = def.cible === "CONDUCTEUR" || (def.cible === "AUCUNE" && def.filtres.includes("CONDUCTEUR"));
  return {
    type,
    dateDebutPeriode: avecPeriode && p.dateDebutPeriode ? p.dateDebutPeriode : undefined,
    dateFinPeriode: avecPeriode && p.dateFinPeriode ? p.dateFinPeriode : undefined,
    idEngin: vehicule && p.idEngin ? Number(p.idEngin) : undefined,
    idConducteur: conducteur && p.idConducteur ? Number(p.idConducteur) : undefined,
    idChantier: def.cible === "CHANTIER" && p.idChantier ? Number(p.idChantier) : undefined,
  };
}
