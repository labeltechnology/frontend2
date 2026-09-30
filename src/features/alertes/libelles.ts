import type { PrioriteAlerte, TypeAlerte } from "@/types/alerte";

/**
 * Libellés français des alertes (2026-09-28), avec accents — `libelleEnum`
 * donnait « Gps desactive pendant mission ». Utilisés par la synthèse des
 * alertes du rapport véhicule (rapport-engin/alertes-groupees.ts) ;
 * réutilisables par la page Alertes.
 */
export const LIBELLES_TYPE_ALERTE: Record<TypeAlerte, string> = {
  SURVITESSE: "Survitesse",
  DEPLACEMENT_ANORMAL: "Déplacement anormal",
  ARRET_PROLONGE: "Arrêt prolongé",
  ENTREE_ZONE_INTERDITE: "Entrée en zone interdite",
  SORTIE_ZONE_AUTORISEE: "Sortie de zone autorisée",
  PERTE_CONNEXION_GPS: "Perte de connexion GPS",
  GPS_DESACTIVE_PENDANT_MISSION: "GPS désactivé pendant une mission",
  STOCK_PIECE_BAS: "Stock de pièce bas",
  MAINTENANCE_A_PREVOIR: "Maintenance à prévoir",
  CONSOMMATION_ANORMALE: "Consommation anormale",
  BAISSE_CARBURANT_SUSPECTE: "Baisse de carburant suspecte",
  DOCUMENT_EXPIRE: "Document expiré",
  DOCUMENT_A_EXPIRER: "Document bientôt expiré",
  INCIDENT_CRITIQUE: "Incident critique",
  CONTROLE_QUALITE_RESERVE: "Réserve au contrôle qualité",
  FATIGUE_CONDUITE: "Temps de conduite dépassé",
  SAISIE_A_VERIFIER: "Saisie à vérifier",
  CHANTIER_NON_DEMARRE: "Chantier non démarré",
  CHANTIER_EN_RETARD: "Chantier en retard",
  VEHICULE_INDISPONIBLE_CHANTIER: "Véhicule indisponible pour un chantier",
  ABSENT_DU_CHANTIER: "Véhicule absent de son chantier",
  INACTIF_SUR_CHANTIER: "Véhicule inactif sur un chantier",
  SORTIE_NON_ENREGISTREE: "Sortie vers le chantier non enregistrée",
  RETOUR_NON_ENREGISTRE: "Retour du chantier non enregistré",
  ENTRETIEN_PENDANT_CHANTIER: "Entretien pendant un chantier",
  DEMANDE_MATERIEL: "Demande de matériel",
};

export const LIBELLES_PRIORITE_ALERTE: Record<PrioriteAlerte, string> = {
  FAIBLE: "faible",
  MOYENNE: "moyenne",
  ELEVEE: "élevée",
  CRITIQUE: "critique",
};

/** Libellé d'un type d'alerte ; type inconnu du frontend (ajout serveur) affiché tel quel. */
export function libelleTypeAlerte(type: string): string {
  return (LIBELLES_TYPE_ALERTE as Record<string, string>)[type] ?? type;
}
