export type StatutConducteur = "EN_SERVICE" | "SUSPENDU" | "CONGE" | "INACTIF";

/**
 * Catégorie d'un conducteur (ajoutée le 2026-09-22, demande explicite de
 * l'utilisateur — « il y a les conducteurs de camion et voiture et il y a
 * un conducteur d'engin, il faut les dissocier ») : détermine quelle
 * qualification est exigée — permis de conduire pour un conducteur de
 * véhicule routier (voiture, camion...), certificat CACES pour un
 * conducteur d'engin de chantier. Même principe que CategorieEngin côté
 * module engin.
 */
export type CategorieConducteur = "VEHICULE_ROUTIER" | "ENGIN_CHANTIER";

export interface Conducteur {
  idConducteur: number;
  matricule: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  categorie: CategorieConducteur;
  /** Obligatoire uniquement si categorie === "VEHICULE_ROUTIER". */
  numeroPermis: string | null;
  categoriePermis: string | null;
  dateExpirationPermis: string | null;
  /** Obligatoire uniquement si categorie === "ENGIN_CHANTIER". */
  numeroCaces: string | null;
  categorieCaces: string | null;
  dateExpirationCaces: string | null;
  statut: StatutConducteur;
  /**
   * Compte de connexion relié à la fiche (2026-09-28, appli mobile du
   * conducteur) : choisi par le responsable, un compte pour une fiche au plus.
   */
  idUtilisateur: number | null;
  emailCompte: string | null;
  /** Photo (2026-09-29) : celle de la fiche, à défaut celle du compte relié ; null = initiales. */
  urlPhoto: string | null;
}

/** Compte de rôle Conducteur, actif, pouvant être relié à une fiche. */
export interface CompteConducteur {
  idUtilisateur: number;
  nomComplet: string;
  email: string;
}

export interface CreerConducteurRequest {
  matricule: string;
  nom: string;
  prenom: string;
  telephone?: string;
  categorie: CategorieConducteur;
  numeroPermis?: string;
  categoriePermis?: string;
  dateExpirationPermis?: string;
  numeroCaces?: string;
  categorieCaces?: string;
  dateExpirationCaces?: string;
}

/** Correction d'une fiche conducteur déjà existante (ajouté le 2026-09-22 — jusque-là aucun moyen de modifier un conducteur depuis l'écran Conducteurs). */
export interface ModifierConducteurRequest {
  matricule: string;
  nom: string;
  prenom: string;
  telephone?: string;
  categorie: CategorieConducteur;
  numeroPermis?: string;
  categoriePermis?: string;
  dateExpirationPermis?: string;
  numeroCaces?: string;
  categorieCaces?: string;
  dateExpirationCaces?: string;
}
