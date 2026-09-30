import type { Conducteur } from "@/types/conducteur";
import type { Engin, TypeEngin } from "@/types/engin";

export type StatutChantier = "PLANIFIE" | "EN_COURS" | "TERMINE" | "ANNULE";

export type StatutAffectationChantier = "ACTIVE" | "TERMINEE" | "ANNULEE";

export interface Chantier {
  idChantier: number;
  nom: string;
  lieu: string | null;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  description: string | null;
  motifAnnulation: string | null;
  statut: StatutChantier;
  /** Position sur la carte (fiche chantier, 2026-09-24) — null tant que non placée. */
  latitude: number | null;
  longitude: number | null;
}

export interface CreerChantierRequest {
  nom: string;
  lieu?: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

/** Position absente = inchangée côté backend (voir ChantierService#modifier). */
export interface ModifierChantierRequest {
  nom: string;
  lieu?: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

/** Rattachement d'un véhicule à un chantier (même principe qu'une Affectation, transposé). */
export interface AffectationChantier {
  idAffectationChantier: number;
  dateDebut: string;
  dateFin: string | null;
  motifAnnulation: string | null;
  statut: StatutAffectationChantier;
  engin: Engin;
  chantier: Chantier;
  /** Période prévue du véhicule sur le chantier (2026-09-24), comprise dans les dates du chantier. */
  dateDebutPrevue: string;
  dateFinPrevue: string;
}

export interface CreerAffectationChantierRequest {
  idEngin: number;
  idChantier: number;
  /** Facultatives : absentes = toute la période du chantier. */
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
}

/**
 * Rattachement d'un conducteur à un chantier — même principe qu'
 * `AffectationChantier` (engin). Depuis le 2026-09-29 (V63), chaque
 * rattachement a SA période, comprise dans les dates du chantier : un
 * chevauchement avec un autre chantier n'est accepté que si les deux
 * rattachements sont « multi-sites » (conducteur partagé entre sites, cas
 * demandé le 2026-09-23) ; jamais avec une mission.
 */
export interface AffectationConducteurChantier {
  idAffectationConducteurChantier: number;
  dateDebut: string;
  dateFin: string | null;
  motifAnnulation: string | null;
  statut: StatutAffectationChantier;
  conducteur: Conducteur;
  chantier: Chantier;
  /** Période prévue du conducteur (2026-09-29). Facultatives pour un serveur plus ancien. */
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
  multiSites?: boolean;
}

export interface CreerAffectationConducteurChantierRequest {
  idConducteur: number;
  idChantier: number;
  /** Facultatives : absentes = toute la période du chantier. */
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
  multiSites?: boolean;
}

/**
 * Besoin en matériel (type d'engin/véhicule + quantité) exprimé pour un
 * chantier (ajouté le 2026-09-23, demande explicite de l'utilisateur) :
 * « au moment de la création de chantier il faut aussi le besoin en
 * matière d'engin et véhicule pour voir la disponibilité du matériel
 * roulant pour mieux connaître en avance et mieux planifier ».
 * `quantiteDisponiblePrevisionnelle` est calculée à la volée côté backend :
 * flotte utilisable du type moins les engins déjà réservés par d'autres
 * chantiers sur une période qui chevauche celle de ce chantier.
 */
export interface BesoinMaterielChantier {
  idBesoinMaterielChantier: number;
  typeEngin: TypeEngin;
  quantite: number;
  quantiteDisponiblePrevisionnelle: number;
}

export interface CreerBesoinMaterielChantierRequest {
  idChantier: number;
  idTypeEngin: number;
  quantite: number;
}

export interface ModifierBesoinMaterielChantierRequest {
  quantite: number;
}

/**
 * Type d'une zone de chantier — pilote à la fois l'outil de la boîte à
 * outils (voir PlanChantierPage.tsx) et le rendu sur la carte (icône ou
 * tracé). LOCAL_TECHNIQUE accepte deux géométries (point ou polygone, au
 * choix de l'utilisateur) ; AUTRE est la valeur historique des zones créées
 * avant l'introduction de cette notion, plus proposée à la création.
 */
export type TypeZoneChantier = "LOCAL_TECHNIQUE" | "LOCAL_MEDICAL" | "STOCKAGE" | "ROUTE" | "AUTRE";

/**
 * Zone délimitée sur le terrain d'un chantier — ex. "Local technique",
 * "Local médical", "Stockage", ou le tracé de la route pour un chantier de
 * construction routière. Tracée sur une carte OpenStreetMap,
 * `geometrieGeoJson` est un Point, une LineString ou un Polygon GeoJSON en
 * coordonnées géographiques réelles (même principe que ZoneGeographique côté
 * zones GPS) — renommé depuis `polygoneGeoJson` : il ne contient plus
 * systématiquement un polygone depuis l'introduction de `TypeZoneChantier`.
 */
export interface ZoneChantier {
  idZoneChantier: number;
  idChantier: number;
  nom: string;
  type: TypeZoneChantier;
  couleur: string | null;
  geometrieGeoJson: string;
}

export interface CreerZoneChantierRequest {
  idChantier: number;
  nom: string;
  type: TypeZoneChantier;
  couleur?: string;
  geometrieGeoJson: string;
}

export interface ModifierZoneChantierRequest {
  nom: string;
  type: TypeZoneChantier;
  couleur?: string;
  geometrieGeoJson: string;
}

// ---- Fiche chantier (2026-09-24) -------------------------------------------
// Page unique : identification, carte, besoins en matériel, engins en
// glisser-déposer, enregistrés en une seule fois (FicheChantierService côté
// backend, une transaction : tout ou rien).

export interface BesoinFicheRequest {
  idTypeEngin: number;
  quantite: number;
}

/** État VOULU de la fiche : le backend calcule ajouts, modifications et retraits. */
export interface FicheChantierRequest {
  nom: string;
  lieu?: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  description?: string;
  /** Les deux ensemble, ou aucune (= chantier non placé / repère retiré). */
  latitude?: number;
  longitude?: number;
  besoins: BesoinFicheRequest[];
  /** Véhicules à employer, chacun avec SA période sur le chantier (« date de mission du véhicule »). */
  engins: EnginFicheRequest[];
  /** Conducteurs et leur période (2026-09-29) ; absent = conducteurs inchangés. */
  conducteurs?: ConducteurFicheRequest[];
  /** Organisation (V64) : type, priorité, responsable, budget, client ; absente = inchangée. */
  organisation?: OrganisationChantierRequest;
}

/** Période absente = toute la période du chantier ; multiSites : partagé avec d'autres chantiers. */
export interface ConducteurFicheRequest {
  idConducteur: number;
  dateDebut?: string;
  dateFin?: string;
  multiSites?: boolean;
}

/** Période absente = toute la période du chantier ; sinon comprise dans ses dates. */
export interface EnginFicheRequest {
  idEngin: number;
  dateDebut?: string;
  dateFin?: string;
}

export interface FicheChantier {
  chantier: Chantier;
  besoins: BesoinMaterielChantier[];
  /** Rattachements ACTIFS uniquement. */
  engins: AffectationChantier[];
  /** Conducteurs ACTIFS (2026-09-29) ; absent sur un serveur plus ancien. */
  conducteurs?: AffectationConducteurChantier[];
  /** Organisation (V64) ; absente sur un serveur plus ancien. */
  organisation?: OrganisationChantier;
}

/**
 * DISPONIBLE : tout statut sauf en panne ; INDISPONIBLE : en panne.
 * Les conflits ne sont pas une situation : ils dépendent de la période
 * choisie pour chaque véhicule (voir `occupations` et
 * DisponibiliteEnginChantier côté backend, 2026-09-24).
 */
export type SituationEnginChantier = "DISPONIBLE" | "SUR_CE_CHANTIER" | "INDISPONIBLE";

/** CHANTIER : autre chantier ; MISSION : mission planifiée ou en cours (2026-09-29). */
export type TypeOccupation = "CHANTIER" | "MISSION";

/** Période pendant laquelle un véhicule ou un conducteur est déjà pris (autre chantier ou mission). */
export interface OccupationChantier {
  /** null pour une mission. */
  idChantier: number | null;
  /** Nom du chantier, ou motif de la mission. */
  nomChantier: string;
  dateDebut: string;
  dateFin: string;
  /** Absent sur un serveur plus ancien : traité comme CHANTIER. */
  type?: TypeOccupation;
  /** Conducteur partagé sur cet autre chantier. */
  multiSites?: boolean;
}

export interface EnginCandidatChantier {
  engin: Engin;
  situation: SituationEnginChantier;
  /** Périodes déjà prises sur d'autres chantiers, triées par date. */
  occupations: OccupationChantier[];
  /** Réservé aux chantiers critiques (V64) ; absent sur un serveur plus ancien. */
  reserveCritique?: boolean;
}

// ---- Conducteurs de la fiche (2026-09-29) -----------------------------------

/** DISPONIBLE : en service ; INDISPONIBLE : suspendu, en congé ou inactif. */
export type SituationConducteurChantier = "DISPONIBLE" | "SUR_CE_CHANTIER" | "INDISPONIBLE";

export interface ConducteurCandidatChantier {
  conducteur: Conducteur;
  situation: SituationConducteurChantier;
  /** Périodes prises : autres chantiers (avec leur partage) et missions actives. */
  occupations: OccupationChantier[];
}

// ---- Suivi des chantiers (2026-09-29) -----------------------------------------

export type EtatSuiviChantier = "A_VENIR" | "NON_DEMARRE" | "DANS_LES_TEMPS" | "EN_RETARD" | "TERMINE" | "ANNULE";

/** Ligne de la liste des chantiers (GET /api/chantiers/synthese). */
export interface ChantierResume {
  chantier: Chantier;
  etat: EtatSuiviChantier;
  vehicules: number;
  conducteurs: number;
  /** % du temps prévu écoulé ; null : annulé ou pas commencé. */
  avancement: number | null;
  /** Jours avant la fin prévue (négatif = dépassée) ; null : terminé ou annulé. */
  joursRestants: number | null;
  alertesOuvertes: number;
  /** Organisation résumée (V64) ; absente sur un serveur plus ancien. */
  priorite?: PrioriteChantier;
  typeChantier?: string | null;
  idResponsable?: number | null;
  nomResponsable?: string | null;
  demandesEnAttente?: number;
}

export interface LigneCoutChantier {
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  debut: string;
  fin: string;
  jours: number;
  litres: number;
  carburant: number;
  maintenance: number;
  coutsFixes: number;
  total: number;
  heuresJournal: number;
  coutParHeure: number | null;
}

/** Coûts réels à date d'un chantier (GET /api/chantiers/{id}/couts). */
export interface CoutsChantier {
  idChantier: number;
  nomChantier: string;
  calculeLe: string;
  vehicules: LigneCoutChantier[];
  carburant: number;
  maintenance: number;
  coutsFixes: number;
  total: number;
  joursVehicules: number;
  coutParJourVehicule: number;
  heuresJournal: number;
  /** Véhicules sans coûts fixes renseignés : total sous-estimé. */
  coutsFixesManquants: string[];
  /** Incidents rattachés au chantier et leur coût estimé (V64) — hors total. */
  incidents?: number;
  coutIncidentsEstime?: number;
}

// ---- Journal de chantier (2026-09-29) ------------------------------------------

export type Meteo = "ENSOLEILLE" | "NUAGEUX" | "PLUIE" | "ORAGE" | "VENT_FORT" | "CYCLONE";

export interface HeuresEngin {
  idEngin: number;
  vehicule: string;
  heures: number;
  remarque: string | null;
}

export interface PhotoJournal {
  idPhoto: number;
  legende: string | null;
  dateCreation: string;
  urlFichier: string;
}

export interface JournalChantier {
  idJournal: number;
  idChantier: number;
  dateJour: string;
  meteo: Meteo | null;
  effectif: number | null;
  travauxRealises: string | null;
  incidents: string | null;
  remarques: string | null;
  engins: HeuresEngin[];
  totalHeures: number;
  photos: PhotoJournal[];
  dateModification: string | null;
}

export interface EnregistrerJournalRequest {
  dateJour: string;
  meteo?: Meteo | null;
  effectif?: number | null;
  travauxRealises?: string;
  incidents?: string;
  remarques?: string;
  engins: { idEngin: number; heures: number; remarque?: string }[];
}

// ---- Terrain, matériel, demandes, rentabilité, analyse (V64, 2026-09-29) --------

export type PrioriteChantier = "NORMALE" | "HAUTE" | "CRITIQUE";

export interface TypeChantier {
  idTypeChantier: number;
  libelle: string;
  /** 1 = conditions normales ; moins de 1 = sévères (l'entretien arrive plus tôt). */
  facteurEntretien: number;
  heuresJourPrevues: number;
  actif: boolean;
}

export interface EnregistrerTypeChantierRequest {
  libelle: string;
  facteurEntretien: number;
  heuresJourPrevues: number;
  actif?: boolean;
}

export interface OrganisationChantier {
  idTypeChantier: number | null;
  libelleTypeChantier: string | null;
  priorite: PrioriteChantier;
  idResponsable: number | null;
  nomResponsable: string | null;
  /** null = rayon par défaut (300 m). */
  rayonPresenceMetres: number | null;
  budgetMateriel: number | null;
  clientNom: string | null;
  clientContact: string | null;
}

export interface OrganisationChantierRequest {
  idTypeChantier?: number | null;
  priorite?: PrioriteChantier;
  idResponsable?: number | null;
  rayonPresenceMetres?: number | null;
  budgetMateriel?: number | null;
  clientNom?: string | null;
  clientContact?: string | null;
}

export interface ResponsableChantier {
  idUtilisateur: number;
  nom: string | null;
  role: string;
}

export interface ReserveCritique {
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  motif: string | null;
}

// Terrain (présence GPS, heures, taux)
export type StatutPresence = "PRESENT" | "ABSENT" | "SANS_GPS" | "NON_LOCALISABLE";
export type SourcePresence = "ZONES" | "RAYON" | "AUCUNE";

export interface JourPresence {
  jour: string;
  /** null = pas encore calculé (calcul de nuit). */
  statut: StatutPresence | null;
  km: number | null;
  heures: number | null;
  premiereHeure: string | null;
  derniereHeure: string | null;
}

export interface TerrainVehicule {
  idAffectation: number;
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  statutEngin: string;
  equipeGps: boolean;
  statutRattachement: StatutAffectationChantier;
  debut: string;
  fin: string;
  joursEcoules: number;
  joursPresents: number;
  joursAbsents: number;
  joursSansDonnees: number;
  tauxPresence: number | null;
  tauxDisponibilite: number | null;
  km: number;
  heuresJournal: number;
  heuresPrevues: number;
  tauxUtilisation: number | null;
  absencesConsecutives: number;
  inactiviteConsecutive: number;
  derniersJours: JourPresence[];
}

export interface TerrainChantier {
  idChantier: number;
  calculeJusquAu: string;
  sourcePresence: SourcePresence;
  rayonPresenceMetres: number;
  heuresJourPrevues: number;
  tauxPresence: number | null;
  tauxDisponibilite: number | null;
  tauxUtilisation: number | null;
  km: number;
  heuresJournal: number;
  heuresPrevues: number;
  vehicules: TerrainVehicule[];
}

export interface EcheanceChantier {
  idEngin: number;
  vehicule: string;
  poste: string;
  prochaineDate: string | null;
  prochainCompteur: number | null;
  compteurActuel: number;
  unite: string;
  dateEstimee: string;
  avantDepart: boolean;
  motif: string;
}

// Sorties et retours
export type TypeMouvement = "SORTIE" | "RETOUR";
export type EtatMateriel = "BON" | "RESERVES" | "ENDOMMAGE";

export interface PhotoMouvement {
  idPhoto: number;
  legende: string | null;
  dateCreation: string | null;
  urlFichier: string;
}

export interface MouvementMateriel {
  idMouvement: number;
  type: TypeMouvement;
  dateHeure: string;
  kilometrage: number | null;
  compteurHoraire: number | null;
  niveauCarburant: number | null;
  etat: EtatMateriel;
  observations: string | null;
  elementsManquants: string[];
  note: number | null;
  commentaireNote: string | null;
  idIncident: number | null;
  idMaintenance: number | null;
  statutMaintenance: string | null;
  photos: PhotoMouvement[];
  dateModification: string | null;
}

export interface MouvementsVehicule {
  idAffectation: number;
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  debut: string;
  fin: string;
  statutRattachement: StatutAffectationChantier;
  sortie: MouvementMateriel | null;
  retour: MouvementMateriel | null;
  kmParcourus: number | null;
  heuresMoteur: number | null;
  ecartCarburant: number | null;
  dureeJours: number | null;
  delaiRemiseEnServiceJours: number | null;
  elementsBord: string[];
}

export interface EnregistrerMouvementRequest {
  dateHeure: string;
  kilometrage?: number | null;
  compteurHoraire?: number | null;
  niveauCarburant?: number | null;
  etat: EtatMateriel;
  observations?: string;
  elementsManquants?: string[];
  note?: number | null;
  commentaireNote?: string;
  declarerDegats?: boolean;
  creerMaintenance?: boolean;
}

// Défaillances (incidents et maintenances rattachés)
export type CauseDefaillance = "USURE" | "MAUVAISE_UTILISATION" | "DEFAUT_MATERIEL" | "ACCIDENT" | "ENVIRONNEMENT" | "AUTRE";
export type NatureDefaillance = "INCIDENT" | "MAINTENANCE";

export interface Defaillance {
  nature: NatureDefaillance;
  id: number;
  date: string | null;
  idEngin: number | null;
  vehicule: string | null;
  type: string | null;
  description: string | null;
  statut: string | null;
  cout: number | null;
  cause: CauseDefaillance | null;
  idChantier: number | null;
}

export interface LignePareto {
  cause: CauseDefaillance;
  libelle: string;
  nombre: number;
  part: number;
  partCumulee: number;
  cout: number;
}

export interface DefaillancesChantier {
  incidents: Defaillance[];
  maintenances: Defaillance[];
  aRattacher: Defaillance[];
  pannes: number;
  coutMaintenances: number;
  coutIncidentsEstime: number;
  sansCause: number;
  pareto: LignePareto[];
}

export interface ImputationRequest {
  idChantier: number | null;
  cause: CauseDefaillance | null;
}

export interface Remplacant {
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  statut: string;
  debut: string;
  fin: string;
}

// Demandes de matériel
export type StatutDemande = "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | "SERVIE" | "ANNULEE";

export interface DemandeMateriel {
  idDemande: number;
  idChantier: number;
  nomChantier: string;
  idTypeEngin: number;
  typeEngin: string;
  quantite: number;
  dateDebut: string;
  dateFin: string;
  priorite: PrioriteChantier;
  motif: string | null;
  statut: StatutDemande;
  idDemandeur: number | null;
  nomDemandeur: string | null;
  dateDemande: string;
  nomRepondant: string | null;
  dateReponse: string | null;
  reponse: string | null;
  dateService: string | null;
  delaiReponseHeures: number | null;
  delaiServiceJours: number | null;
  /** Véhicules du type non retenus ailleurs sur la période (demande en attente seulement). */
  disponiblesEstimes: number | null;
}

export interface CreerDemandeRequest {
  idChantier: number;
  idTypeEngin: number;
  quantite: number;
  dateDebut: string;
  dateFin: string;
  priorite?: PrioriteChantier;
  motif?: string;
}

export interface IndicateursDemandes {
  enAttente: number;
  enAttenteCritiques: number;
  acceptees: number;
  servies: number;
  delaiMoyenReponseHeures: number | null;
  delaiMoyenServiceJours: number | null;
  tauxAcceptation: number | null;
}

// Rentabilité
export type UniteTarif = "JOUR" | "HEURE";
export type PosteCoutChantier = "CARBURANT" | "MAINTENANCE" | "COUTS_FIXES";

export interface TarifRefacturation {
  idTypeEngin: number;
  typeEngin: string;
  unite: UniteTarif | null;
  tarif: number | null;
}

export interface LigneRentabilite {
  idEngin: number;
  vehicule: string;
  typeEngin: string | null;
  unite: UniteTarif | null;
  quantite: number | null;
  tarif: number | null;
  refacturable: number;
  cout: number;
  marge: number;
}

export interface RentabiliteChantier {
  idChantier: number;
  nomChantier: string;
  statut: StatutChantier;
  typeChantier: string | null;
  joursVehicules: number;
  coutReel: number;
  coutParJourVehicule: number;
  posteDominant: PosteCoutChantier | null;
  budgetMateriel: number | null;
  ecartBudget: number | null;
  consommationBudget: number | null;
  refacturable: number;
  marge: number;
  tauxMarge: number | null;
  typesSansTarif: string[];
  clientNom: string | null;
  lignes: LigneRentabilite[];
}

// Analyse
export interface AnalyseTypeChantier {
  idTypeChantier: number | null;
  typeChantier: string;
  chantiers: number;
  joursVehicules: number;
  heuresJournal: number;
  heuresParJourVehicule: number | null;
  cout: number;
  coutParHeure: number | null;
  coutParJourVehicule: number | null;
  defaillances: number;
  defaillancesPour100Jours: number | null;
  noteMoyenne: number | null;
}

export interface AdaptationMateriel {
  typeEngin: string;
  typeChantier: string;
  joursVehicules: number;
  coutParHeure: number | null;
  coutParHeureReference: number | null;
  defaillancesPour100Jours: number | null;
  defaillancesPour100JoursReference: number | null;
  noteMoyenne: number | null;
  malAdapte: boolean;
  motifs: string[];
}

export interface PrevisionMois {
  /** AAAA-MM */
  mois: string;
  passe: boolean;
  joursParType: Record<string, number>;
  total: number;
}

export interface AnalyseChantiers {
  calculeLe: string;
  parType: AnalyseTypeChantier[];
  adaptation: AdaptationMateriel[];
  prevision: PrevisionMois[];
  pareto: LignePareto[];
}
