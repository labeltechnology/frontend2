/** Photos de profil (2026-09-29) — voir PhotosProfilController côté serveur. */

/** L'utilisateur connecté (GET /api/mon-compte/profil). */
export interface MonProfil {
  idUtilisateur: number;
  nom: string | null;
  prenom: string | null;
  nomComplet: string;
  email: string;
  role: string | null;
  /** Fiche conducteur reliée au compte, null sinon. */
  idConducteur: number | null;
  /** null = pas de photo (afficher les initiales). */
  urlPhoto: string | null;
}

/** Réponse d'un changement de photo : nouvelle URL, null si la photo a été retirée. */
export interface PhotoProfilReponse {
  urlPhoto: string | null;
}
