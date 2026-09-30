import type { QueryKey } from "@tanstack/react-query";

/**
 * Canaux temps réel côté écran (2026-09-29) : pour chaque canal du serveur
 * (tempsreel.sources), où ranger ce qui arrive dans le cache react-query.
 *
 * - `listes` : les listes dont les éléments ont EXACTEMENT la forme de
 *   GET /api/…/{id} (l'objet reçu y remplace l'ancien, sur place) ;
 * - `detail` : la clé du détail de l'objet, s'il y en a une ;
 * - `racines` : tout ce qui dépend du canal, relu ensuite (seules les
 *   requêtes affichées sont réellement relues par react-query) ;
 * - `libelle` : pour l'avis « modifié par un autre ».
 *
 * Un canal absent d'ici n'est simplement pas suivi par l'écran.
 */
export interface DefinitionCanal {
  racines: readonly string[];
  champId?: string;
  listes?: (cle: QueryKey) => boolean;
  detail?: (id: number) => QueryKey;
  libelle?: string;
}

/** Clé exactement égale à `[racine]`. */
const exacte =
  (racine: string) =>
  (cle: QueryKey): boolean =>
    cle.length === 1 && cle[0] === racine;

/** Clé `[racine, filtre]` (ex. ["factures-garage", idGarage | "toutes"]). */
const avecFiltre =
  (racine: string) =>
  (cle: QueryKey): boolean =>
    cle.length === 2 && cle[0] === racine;

export const CANAUX: Readonly<Record<string, DefinitionCanal>> = {
  engins: {
    // « pilotage » : les véhicules immobilisés du tableau de bord de direction suivent tout de suite.
    racines: ["engins", "echeances-entretien", "pilotage"],
    champId: "idEngin",
    listes: exacte("engins"),
    detail: (id) => ["engins", id],
    libelle: "Ce véhicule",
  },
  conducteurs: { racines: ["conducteurs"], champId: "idConducteur", listes: exacte("conducteurs"), libelle: "Ce conducteur" },
  affectations: { racines: ["affectations"], champId: "idAffectation", listes: exacte("affectations"), libelle: "Cette affectation" },
  missions: { racines: ["missions"], champId: "idMission", listes: exacte("missions"), libelle: "Cette mission" },
  documents: { racines: ["documents"], champId: "idDocument", listes: exacte("documents"), libelle: "Ce document" },
  zones: { racines: ["zones"], champId: "idZoneGeographique", listes: exacte("zones"), libelle: "Cette zone" },
  incidents: { racines: ["incidents", "pilotage"], champId: "idIncident", listes: exacte("incidents"), libelle: "Cet incident" },
  alertes: { racines: ["alertes"], champId: "idAlerte", listes: avecFiltre("alertes") },
  carburant: { racines: ["carburant"], champId: "idCarburant", listes: exacte("carburant"), libelle: "Ce plein" },
  chantiers: {
    racines: [
      "chantiers",
      "fiche-chantier",
      "affectations-chantier",
      "affectations-conducteur-chantier",
      "besoins-materiel-chantier",
      "zones-chantier",
    ],
    champId: "idChantier",
    listes: exacte("chantiers"),
    libelle: "Ce chantier",
  },
  maintenances: {
    racines: ["maintenances", "pilotage"],
    champId: "idMaintenance",
    listes: exacte("maintenances"),
    libelle: "Cette maintenance",
  },
  "garages-externes": {
    racines: ["garages-externes"],
    champId: "idGarageExterne",
    listes: exacte("garages-externes"),
    libelle: "Ce garage",
  },
  fournisseurs: { racines: ["fournisseurs"], champId: "idFournisseur", listes: exacte("fournisseurs"), libelle: "Ce fournisseur" },
  "factures-garage": { racines: ["factures-garage"], champId: "idFactureGarage", listes: avecFiltre("factures-garage") },
  "contrats-location-externe": {
    racines: ["contrats-location-externe"],
    champId: "idContratLocationExterne",
    listes: exacte("contrats-location-externe"),
    libelle: "Ce contrat",
  },
  "factures-location": { racines: ["factures-location"], champId: "idFactureLocation", listes: avecFiltre("factures-location") },
  "contrats-location-entrante": {
    racines: ["contrats-location-entrante"],
    champId: "idContratLocationEntrante",
    listes: exacte("contrats-location-entrante"),
    libelle: "Ce contrat",
  },
  "factures-location-entrante": {
    racines: ["factures-location-entrante"],
    champId: "idFactureLocationEntrante",
    listes: avecFiltre("factures-location-entrante"),
  },
  "prestataires-location": {
    racines: ["prestataires-location"],
    champId: "idPrestataireLocation",
    listes: exacte("prestataires-location"),
    libelle: "Ce prestataire",
  },
  "factures-proforma": { racines: ["factures-proforma"], champId: "idFactureProforma", listes: exacte("factures-proforma") },
  rapports: { racines: ["rapports"], champId: "idRapport", listes: exacte("rapports") },
  utilisateurs: { racines: ["utilisateurs"], champId: "idUtilisateur", listes: exacte("utilisateurs"), libelle: "Ce compte" },
  // Positions GPS : poussées toutes les 10 s au plus, vue « flotte » complète.
  gps: { racines: ["gps"] },
  // Canaux « signal » : l'écran relit.
  "types-engin": { racines: ["types-engin"] },
  referentiels: { racines: ["postes-entretien", "elements-bord", "pieces", "travaux-maintenance"] },
  parametres: {
    racines: [
      "parametres-entreprise",
      "parametres-traccar",
      "parametres-mapbox",
      "parametres-carburant",
      "parametres-escalade-alertes",
      "parametres-vehicules-problematiques",
      "parametres-fatigue",
      "parametres-comptables",
      "parametres-envoi-rapports",
    ],
  },
  couts: { racines: ["couts"] },
  conduite: { racines: ["conduite"] },
  performance: { racines: ["performance"] },
  "abonnements-rapports": { racines: ["abonnements-rapports"] },
  webhooks: { racines: ["webhooks"] },
  "journal-audit": { racines: ["journal-audit"] },
  aide: { racines: ["aide"] },
  autres: { racines: [] },
};

/** Clé de la vue « flotte » GPS, remplie directement par le canal gps. */
export const CLE_FLOTTE_GPS: QueryKey = ["gps", "positions", "flotte"];

/**
 * Vues de synthèse (tableaux de bord, coûts, fiabilité…) : elles agrègent
 * plusieurs domaines ; elles sont relues au plus toutes les 10 s après
 * n'importe quel changement de données.
 */
export const RACINES_SYNTHESE: readonly string[] = [
  "fiabilite",
  "couts",
  "performance",
  "renouvellement",
  "recommandations",
  "conduite",
  "comptabilite",
  "suivi-logiciel",
  // Tableau de bord de direction (2026-09-30) : KPI, alertes chiffrées, flotte, coûts du mois.
  "pilotage",
  // Assistant de mise en service (2026-09-30).
  "mise-en-service",
];

/** Canaux qui ne touchent pas aux vues de synthèse (journaux, positions…). */
export const CANAUX_SANS_SYNTHESE: ReadonlySet<string> = new Set(["gps", "journal-audit", "aide", "webhooks", "abonnements-rapports"]);

/** Tous les canaux à demander au serveur (il refuse ceux que le rôle ne peut pas suivre). */
export function canauxAAbonner(): string[] {
  return [...Object.keys(CANAUX), "messagerie"];
}
