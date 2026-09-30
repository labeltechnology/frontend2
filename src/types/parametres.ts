/**
 * Paramètres entreprise (nom, coordonnées, NIF/STAT, taux de TVA, RIB) —
 * une seule ligne côté backend (voir ParametresEntreprise), éditable depuis
 * l'écran Paramètres (capacité ADMINISTRER : administrateur, DG, responsable
 * du parc — lib/droits.ts, 2026-09-28). Utilisés pour générer l'en-tête des factures de location
 * et des factures proforma.
 */
export interface ParametresEntreprise {
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  nif: string | null;
  stat: string | null;
  tauxTvaPourcent: number;
  banqueNom: string | null;
  banqueIban: string | null;
  banqueBic: string | null;
  mentionsPied: string | null;
  /** Nom du fichier tel qu'envoyé par l'utilisateur — {@code null} si aucun logo n'a été téléversé. */
  nomFichierLogoOriginal: string | null;
  /** URL applicative authentifiée (voir AuthenticatedImage) — {@code null} si aucun logo n'a été téléversé. */
  logoUrl: string | null;
}

export interface MettreAJourParametresEntrepriseRequest {
  nom: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  nif?: string;
  stat?: string;
  tauxTvaPourcent: number;
  banqueNom?: string;
  banqueIban?: string;
  banqueBic?: string;
  mentionsPied?: string;
}

/**
 * Paramètres d'intégration Traccar (itération 19) — une seule ligne côté
 * backend (voir ParametresTraccar), séparée de ParametresEntreprise
 * (paramètres techniques d'intégration GPS, sans rapport avec l'identité
 * fiscale de l'entreprise). Éditable depuis l'écran Paramètres, réservé à
 * ADMINISTRER (lib/droits.ts). Le jeton API n'est jamais renvoyé en clair par le
 * backend — seuls jetonConfigure/jetonApercu permettent de savoir s'il est
 * configuré, sans jamais l'exposer entièrement.
 */
export interface ParametresTraccar {
  actif: boolean;
  urlServeur: string;
  jetonConfigure: boolean;
  /** Ex. "••••••••3f2a" — {@code null} si aucun jeton n'est configuré. */
  jetonApercu: string | null;
  intervalleSyncMs: number;
}

export interface MettreAJourParametresTraccarRequest {
  actif: boolean;
  urlServeur: string;
  /** Laisser vide/undefined conserve le jeton déjà enregistré côté backend. */
  jetonApi?: string;
  intervalleSyncMs: number;
}

/**
 * Paramètres d'intégration Mapbox Satellite (vue satellite des cartes de
 * chantier) — une seule ligne côté backend (voir ParametresMapbox), séparée
 * de ParametresTraccar (intégration technique sans rapport avec le GPS,
 * même principe de modularité). Éditable depuis l'écran Paramètres, réservé
 * à ADMINISTRER (lib/droits.ts). Le jeton n'est jamais renvoyé en clair par le backend —
 * seuls accessTokenConfigure/accessTokenApercu permettent de savoir s'il est
 * configuré. Remplace ParametresNimbo (décision du 2026-09-22, résolution
 * insuffisante au-delà du zoom 13 sur une zone rurale de Madagascar) : pas
 * de gabarit d'URL à saisir ici, le format Mapbox Satellite est fixe côté
 * backend (voir TuileSatelliteService).
 */
export interface ParametresMapbox {
  actif: boolean;
  accessTokenConfigure: boolean;
  /** Ex. "••••••••k3f1" — {@code null} si aucun jeton n'est configuré. */
  accessTokenApercu: string | null;
}

export interface MettreAJourParametresMapboxRequest {
  actif: boolean;
  /** Laisser vide/undefined conserve le jeton déjà enregistré côté backend. */
  accessToken?: string;
}
