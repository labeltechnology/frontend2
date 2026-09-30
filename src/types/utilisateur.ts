export type StatutUtilisateur = "ACTIF" | "DESACTIVE";

export interface Role {
  idRole: number;
  libelle: string;
}

export interface Utilisateur {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  statut: StatutUtilisateur;
  role: Role;
  /** Photo de profil (2026-09-29) ; null = initiales. */
  urlPhoto: string | null;
}

export interface CreerUtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  libelleRole: string;
}
