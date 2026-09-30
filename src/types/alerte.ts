export type TypeAlerte =
  | "SURVITESSE"
  | "DEPLACEMENT_ANORMAL"
  | "ARRET_PROLONGE"
  | "ENTREE_ZONE_INTERDITE"
  | "SORTIE_ZONE_AUTORISEE"
  | "PERTE_CONNEXION_GPS"
  | "GPS_DESACTIVE_PENDANT_MISSION"
  | "STOCK_PIECE_BAS"
  | "MAINTENANCE_A_PREVOIR"
  | "CONSOMMATION_ANORMALE"
  | "BAISSE_CARBURANT_SUSPECTE"
  | "DOCUMENT_EXPIRE"
  | "DOCUMENT_A_EXPIRER"
  | "INCIDENT_CRITIQUE"
  // 2026-09-29 : réserve au contrôle qualité d'une maintenance, fatigue au volant
  | "CONTROLE_QUALITE_RESERVE"
  | "FATIGUE_CONDUITE"
  // 2026-09-29 : saisie carburant douteuse confirmée par l'utilisateur (qualité des saisies)
  | "SAISIE_A_VERIFIER"
  // 2026-09-29 : suivi des chantiers
  | "CHANTIER_NON_DEMARRE"
  | "CHANTIER_EN_RETARD"
  | "VEHICULE_INDISPONIBLE_CHANTIER"
  // V64 (2026-09-29) : terrain et matériel des chantiers
  | "ABSENT_DU_CHANTIER"
  | "INACTIF_SUR_CHANTIER"
  | "SORTIE_NON_ENREGISTREE"
  | "RETOUR_NON_ENREGISTRE"
  | "ENTRETIEN_PENDANT_CHANTIER"
  | "DEMANDE_MATERIEL";

export type PrioriteAlerte = "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE";

export interface Alerte {
  idAlerte: number;
  type: TypeAlerte;
  priorite: PrioriteAlerte;
  description: string;
  idEngin: number | null;
  /** Libellé du véhicule concerné (le code n'est plus affiché). */
  libelleVehicule: string | null;
  idConducteur: number | null;
  matriculeConducteur: string | null;
  idZoneGeographique: number | null;
  traitee: boolean;
  dateTraitement: string | null;
  dateCreation: string;
  /**
   * Occurrences cumulées d'une alerte GPS répétée (serveur, 2026-09-28, V48) :
   * 1 sinon. Facultatif pour rester compatible avec un serveur plus ancien.
   */
  nombreOccurrences?: number;
  /** Dernière occurrence cumulée ; null s'il n'y en a qu'une. */
  dateDerniereOccurrence?: string | null;
  /** Escalade par ancienneté (2026-09-28) : priorité d'origine ; null si jamais escaladée. */
  prioriteInitiale?: PrioriteAlerte | null;
  /** Nombre de niveaux montés parce que l'alerte n'était pas traitée. */
  nombreEscalades?: number;
  dateDerniereEscalade?: string | null;
  /** Chantier concerné (2026-09-29) ; absent ou null sinon. */
  idChantier?: number | null;
  nomChantier?: string | null;
}
