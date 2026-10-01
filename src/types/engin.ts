import type { TypeDocument } from "@/types/document";
import type { EntretienInitialRequest } from "@/types/entretien";
import type { SaisieEquipementBordRequest } from "@/types/equipement-bord";
import type { ZoneGeographique } from "@/types/zone";

export type StatutEngin = "DISPONIBLE" | "AFFECTE" | "EN_MISSION" | "EN_PANNE" | "EN_MAINTENANCE" | "REFORME" | "VENDU";

/**
 * Catégorie d'un type d'engin (ajoutée le 2026-09-22) : détermine quel
 * identifiant est exigé sur la fiche d'un engin — immatriculation pour un
 * véhicule routier (voiture, camion...), numéro de série pour un engin de
 * chantier sans plaque routière standard (pelle, bulldozer, niveleuse...).
 */
export type CategorieEngin = "VEHICULE_ROUTIER" | "ENGIN_CHANTIER";

/** Source d'énergie (fiche technique, ajoutée le 2026-09-24 — voir Energie côté backend). */
export type Energie = "GASOIL" | "ESSENCE" | "ELECTRIQUE" | "HYBRIDE" | "AUTRE";

/**
 * Champs de fiche technique d'un engin (ajoutés le 2026-09-24, page « Fiche
 * véhicule » — demande explicite de l'utilisateur : tout saisir en une seule
 * fois à la création « pour éviter la saisie »). Tous facultatifs : les
 * engins créés avant cette date n'en ont pas.
 */
export interface FicheTechniqueEngin {
  energie: Energie | null;
  /** Sert aussi à convertir un niveau de carburant GPS (%) en litres. */
  capaciteReservoirLitres: number | null;
  /**
   * Consommation de référence en L/100 km (2026-09-28) : chaque saisie
   * carburant est contrôlée par rapport à elle. Absente = moyenne historique.
   */
  consommationReferenceL100km?: number | null;
  /** Date de 1re mise en circulation (carte grise), distincte de la date d'acquisition. */
  dateMiseEnCirculation: string | null;
  couleur: string | null;
  /** Véhicule routier uniquement. */
  puissanceFiscaleCv: number | null;
  nombrePlaces: number | null;
  chargeUtileKg: number | null;
}

export interface TypeEngin {
  idTypeEngin: number;
  libelle: string;
  vitesseMaximale: number | null;
  categorie: CategorieEngin;
  actif: boolean;
  /**
   * Performance et utilisation (2026-09-28, V56), tout facultatif : taux
   * d'utilisation (% des jours) et usage par mois (km, ou h pour un engin de
   * chantier) sous lesquels un véhicule du type est sous-utilisé ; coût de
   * référence en Ar par km (ou par h).
   */
  seuilTauxJours?: number | null;
  seuilUsageMensuel?: number | null;
  coutReferenceUnite?: number | null;
  /** Famille du type (2026-10-01, V67) : « Véhicule de service », « Camion »… ; regroupe les types sur le tableau de bord. */
  famille?: string | null;
}

export interface Engin extends FicheTechniqueEngin {
  idEngin: number;
  /**
   * Libellé à afficher (« 1234 TBA — Toyota Hilux »), calculé par le serveur
   * (LibelleVehicule.java). Le code interne n'est plus affiché depuis le
   * 2026-09-25 : il reste dans la réponse de l'API mais volontairement absent
   * de ce type, pour qu'aucun écran ne puisse s'en servir.
   */
  libelleVehicule: string;
  /** Obligatoire uniquement si typeEngin.categorie === "VEHICULE_ROUTIER". */
  immatriculation: string | null;
  numeroChassis: string | null;
  /** Numéro de série constructeur / numéro de parc interne — obligatoire uniquement si typeEngin.categorie === "ENGIN_CHANTIER". */
  numeroSerie: string | null;
  marque: string;
  modele: string;
  dateAcquisition: string | null;
  kilometrage: number | null;
  compteurHeures: number | null;
  statut: StatutEngin;
  equipeGps: boolean;
  typeEngin: TypeEngin;
  /** Règle 7.4 : zones d'opération autorisées assignées à cet engin (plusieurs possibles). */
  zonesOperation: ZoneGeographique[];
}

/** Même forme en création et en modification ; `undefined` = non renseigné. */
export interface FicheTechniqueEnginRequest {
  energie?: Energie;
  capaciteReservoirLitres?: number;
  consommationReferenceL100km?: number;
  dateMiseEnCirculation?: string;
  couleur?: string;
  puissanceFiscaleCv?: number;
  nombrePlaces?: number;
  chargeUtileKg?: number;
}

/**
 * Document administratif saisi directement sur la fiche de création (carte
 * grise, assurance, visite technique) — créé côté backend dans la même
 * transaction que l'engin (voir EnginService#creer). Les alertes
 * d'expiration du module Documents s'appliquent ensuite normalement.
 */
export interface DocumentInitialRequest {
  type: Exclude<TypeDocument, "PERMIS_CONDUIRE">;
  numeroReference?: string;
  dateDebut?: string;
  dateExpiration?: string;
}

export interface CreerEnginRequest extends FicheTechniqueEnginRequest {
  // Pas de codeEngin (2026-09-25) : le serveur le génère.
  /** Obligatoire si le type choisi est de catégorie VEHICULE_ROUTIER. */
  immatriculation?: string;
  numeroChassis?: string;
  /** Obligatoire si le type choisi est de catégorie ENGIN_CHANTIER. */
  numeroSerie?: string;
  marque: string;
  modele: string;
  dateAcquisition?: string;
  idTypeEngin: number;
  equipeGps?: boolean;
  /** Compteurs relevés à l'entrée dans le parc (absent = 0). */
  kilometrageInitial?: number;
  compteurHeuresInitial?: number;
  documents?: DocumentInitialRequest[];
  /** Éléments de sécurité / boîte à outils (OUI/NON + observation). */
  equipementsBord?: SaisieEquipementBordRequest[];
  /** Dernières interventions connues par poste d'entretien. */
  entretiens?: EntretienInitialRequest[];
}

/**
 * Correction d'une fiche engin déjà existante (ajouté le 2026-09-22 — jusque-là
 * aucun moyen de modifier un engin depuis l'écran Engins). Mêmes champs que
 * {@link CreerEnginRequest} sans `equipeGps`, qui a sa propre action dédiée
 * (voir useEquiperGps) — même principe côté backend (ModifierEnginRequest).
 * Depuis le 2026-09-24 : la fiche technique se corrige ici aussi ; les
 * compteurs initiaux et les documents n'existent qu'à la création.
 */
export interface ModifierEnginRequest extends FicheTechniqueEnginRequest {
  // Pas de codeEngin (2026-09-25) : le serveur garde le code existant.
  immatriculation?: string;
  numeroChassis?: string;
  numeroSerie?: string;
  marque: string;
  modele: string;
  dateAcquisition?: string;
  idTypeEngin: number;
}

/** Photo réelle d'un engin (fichier uploadé — voir EnginPhoto côté backend). */
export interface EnginPhoto {
  idEnginPhoto: number;
  nomFichierOriginal: string | null;
  typeContenu: string | null;
  tailleOctets: number | null;
  estPrincipale: boolean;
  /** URL applicative authentifiée — jamais un chemin de fichier direct (voir EnginPhotoController). */
  url: string;
}

// --- Types de véhicule (référentiel, écran dédié « Types de véhicule » depuis le 2026-09-22) ---

export interface CreerTypeEnginRequest {
  libelle: string;
  vitesseMaximale: number;
  categorie: CategorieEngin;
  seuilTauxJours?: number | null;
  seuilUsageMensuel?: number | null;
  coutReferenceUnite?: number | null;
  famille?: string | null;
}

export interface ModifierTypeEnginRequest {
  libelle: string;
  vitesseMaximale: number;
  categorie: CategorieEngin;
  seuilTauxJours?: number | null;
  seuilUsageMensuel?: number | null;
  coutReferenceUnite?: number | null;
  famille?: string | null;
}
