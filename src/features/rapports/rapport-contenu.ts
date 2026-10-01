import type { TypeRapport } from "@/types/rapport";

/**
 * Équivalent TypeScript de {@code RapportExportUtils} côté backend (voir
 * {@code rapport/export/RapportExportUtils.java}) : construit exactement les
 * mêmes lignes clé/valeur à partir du même {@code contenuJson}, pour que
 * l'aperçu affiché dans le navigateur (NB de l'utilisateur : un aperçu doit
 * précéder tout export PDF/Excel) montre bien le même contenu que les
 * fichiers téléchargés.
 */
export interface LigneRapportContenu {
  libelle: string;
  valeur: string;
  indentation: number;
}

export const TITRES_RAPPORT: Record<TypeRapport, string> = {
  MISSIONS: "Rapport des missions",
  MAINTENANCE: "Rapport de maintenance",
  CARBURANT: "Rapport de consommation carburant",
  INCIDENTS: "Rapport des incidents",
  PARC: "Rapport d'état du parc",
  VEHICULE: "Rapport de synthèse par véhicule",
  CONDUCTEUR: "Rapport de synthèse par conducteur",
  DOCUMENTS_A_EXPIRER: "Rapport des documents arrivant à expiration",
  CHANTIER: "Rapport par chantier",
  RENTABILITE: "Rapport de rentabilité par véhicule",
  TRESORERIE: "Rapport de trésorerie (état des factures)",
  INCIDENTS_RECAPITULATIF: "Récapitulatif des incidents et accidents",
  UTILISATION_PARC: "Rapport sur le taux d'utilisation du parc",
  SYNTHESE_GENERALE: "Synthèse générale",
  PERFORMANCE_UTILISATION: "Performance et utilisation",
  COUTS_RENTABILITE: "Coûts et rentabilité (TCO)",
  FIABILITE_CONFORMITE: "Maintenance, fiabilité et conformité",
  SINISTRALITE: "Sinistralité",
  RENOUVELLEMENT: "Renouvellement du parc",
};

const LIBELLES_CHAMPS: Record<string, string> = {
  nombreMissions: "Nombre de missions",
  nombreTerminees: "Missions terminées",
  nombreAnnulees: "Missions annulées",
  kilometresParcourus: "Kilomètres parcourus",
  nombreMaintenances: "Nombre de maintenances",
  coutTotal: "Coût total",
  nombrePleins: "Nombre de pleins",
  litresTotal: "Litres au total",
  montantTotal: "Montant total",
  nombreIncidents: "Nombre d'incidents",
  nombreCritiques: "Incidents critiques",
  coutEstimeTotal: "Coût estimé total",
  nombreTotalEngins: "Nombre total de véhicules",
  repartitionParStatut: "Répartition par statut",
  nombreExpires: "Documents expirés",
  nombreExpirantSousTrenteJours: "Documents expirant sous 30 jours",
  repartitionExpiresParType: "Répartition des expirés par type",
  listeExpires: "Détail des documents expirés",
  listeExpirantBientot: "Détail des documents expirant bientôt",
  nombreRattachements: "Nombre de rattachements",
  nombreRattachementsTermines: "Rattachements terminés",
  nombreRattachementsAnnules: "Rattachements annulés",
  enginsActuellementRattaches: "Véhicules actuellement rattachés",
  // Rapport complet d'un chantier (V64, 2026-09-29)
  statutChantier: "Statut du chantier",
  periodeChantier: "Période prévue",
  typeChantier: "Type de chantier",
  prioriteChantier: "Priorité",
  responsableChantier: "Chef de chantier",
  conducteursDuChantier: "Conducteurs",
  vehiculesEmployes: "Véhicules employés (jours, heures, coût)",
  joursVehicules: "Jours-véhicule",
  coutCarburant: "Carburant (Ar)",
  coutMaintenance: "Maintenance (Ar)",
  coutCoutsFixes: "Coûts fixes (Ar)",
  coutTotalMateriel: "Coût total du matériel (Ar)",
  coutParJourVehicule: "Coût par jour-véhicule (Ar)",
  tauxPresenceGps: "Présence sur le chantier (GPS)",
  tauxDisponibiliteMateriel: "Disponibilité du matériel",
  tauxUtilisationReelle: "Utilisation réelle (heures)",
  kmSurChantier: "Kilomètres (GPS)",
  heuresJournal: "Heures au journal",
  joursJournalRediges: "Journées renseignées dans le journal",
  budgetMateriel: "Budget matériel (Ar)",
  ecartBudget: "Écart au budget (Ar)",
  montantRefacturable: "Montant refacturable (Ar HT)",
  margeMateriel: "Marge matériel (Ar)",
  nombreIncidentsChantier: "Incidents",
  nombrePannesChantier: "Pannes",
  coutIncidentsEstime: "Coût estimé des incidents (Ar)",
  defaillancesChantier: "Incidents du chantier",
  causesPrincipales: "Causes principales",
  demandesMateriel: "Demandes de matériel",
  demandesServies: "Demandes satisfaites",
  revenusLocation: "Revenus de location (HT)",
  nombreFacturesLocation: "Nombre de factures de location",
  coutTotalCharges: "Coût total (maintenance + carburant)",
  rentabiliteNette: "Rentabilité nette (revenus − charges)",
  recettesLocation: "Recettes de location (factures émises)",
  depensesGarage: "Dépenses de garage (factures reçues)",
  depensesLocationEntrante: "Dépenses de location entrante (factures reçues)",
  soldeEnAttente: "Solde en attente (recettes − dépenses)",
  montantEnAttente: "Montant en attente",
  nombreEnAttente: "Nombre en attente",
  montantEnRetard: "Montant en retard (> 30 jours)",
  nombreEnRetard: "Nombre en retard (> 30 jours)",
  nombreAccidents: "Nombre d'accidents",
  nombreNonClotures: "Incidents non clôturés",
  repartitionParGravite: "Répartition par gravité",
  repartitionParType: "Répartition par type",
  topEnginsAccidentes: "Véhicules les plus accidentés",
  joursPeriode: "Jours de la période",
  nombreEnginsParc: "Nombre de véhicules du parc",
  joursEnginsDisponibles: "Jours-véhicules disponibles",
  joursEnginsUtilises: "Jours-véhicules utilisés",
  tauxUtilisationParc: "Taux d'utilisation du parc (%)",
  nombreEnginsUtilises: "Véhicules utilisés au moins une fois",
  tauxEnginsUtilises: "Part des véhicules utilisés (%)",
  missions: "Missions",
  maintenance: "Maintenance",
  carburant: "Carburant",
  incidents: "Incidents et accidents",
  documentsAExpirer: "Documents arrivant à expiration",
  tresorerie: "Trésorerie",
  utilisationParc: "Taux d'utilisation du parc",
  alertes: "Alertes",
  nombreAlertesNonTraitees: "Alertes non traitées",
  repartitionNonTraiteesParPriorite: "Répartition des alertes non traitées par priorité",
  nombreAlertesCreees: "Alertes créées sur la période",
};

function humaniser(cle: string): string {
  const espace = cle.replace(/([A-Z])/g, " $1");
  return espace.charAt(0).toUpperCase() + espace.slice(1).toLowerCase();
}

function formaterValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "—";
  if (typeof valeur === "number") {
    return Number.isInteger(valeur) ? String(valeur) : valeur.toFixed(2);
  }
  return String(valeur);
}

export function construireLignesContenu(contenuJson: string): LigneRapportContenu[] {
  let donnees: Record<string, unknown>;
  try {
    donnees = JSON.parse(contenuJson);
  } catch {
    return [];
  }

  const lignes: LigneRapportContenu[] = [];
  for (const [cle, valeur] of Object.entries(donnees)) {
    ajouterLigne(lignes, cle, valeur, 0);
  }
  return lignes;
}

/**
 * Équivalent récursif de RapportExportUtils.ajouterLigne côté backend — voir son commentaire :
 * l'aplatissement à un seul niveau ne suffit plus depuis SYNTHESE_GENERALE, qui agrège des
 * synthèses elles-mêmes déjà imbriquées (ex. TRESORERIE contient des objets, INCIDENTS_RECAPITULATIF
 * des objets et des listes).
 */
function ajouterLigne(lignes: LigneRapportContenu[], cle: string, valeur: unknown, indentation: number): void {
  // Même principe que côté backend : une clé imbriquée sans entrée dans LIBELLES_CHAMPS reste
  // affichée telle quelle plutôt que passée à humaniser(), qui ne gère pas le SCREAMING_SNAKE_CASE
  // (ex. les statuts de repartitionParStatut).
  const libelle = LIBELLES_CHAMPS[cle] ?? (indentation === 0 ? humaniser(cle) : cle);
  if (valeur !== null && typeof valeur === "object" && !Array.isArray(valeur)) {
    lignes.push({ libelle, valeur: "", indentation });
    for (const [sousCle, sousValeur] of Object.entries(valeur as Record<string, unknown>)) {
      ajouterLigne(lignes, sousCle, sousValeur, indentation + 1);
    }
  } else if (Array.isArray(valeur)) {
    // Ajouté pour DOCUMENTS_A_EXPIRER (premier type dont le contenu inclut des listes de détail,
    // ex. listeExpires) : même principe qu'une valeur objet imbriquée — une ligne d'en-tête, puis
    // une ligne par élément.
    lignes.push({ libelle, valeur: valeur.length === 0 ? "Aucun" : "", indentation });
    for (const element of valeur) {
      lignes.push({ libelle: "", valeur: formaterValeur(element), indentation: indentation + 1 });
    }
  } else {
    lignes.push({ libelle, valeur: formaterValeur(valeur), indentation });
  }
}
