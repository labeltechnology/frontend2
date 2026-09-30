/**
 * Rôles applicatifs (table `role` : V2__seed_data.sql puis V47__niveaux_autorisation.sql,
 * 2026-09-28). Droits de chaque rôle et libellés : voir lib/droits.ts.
 */
export type RoleLibelle =
  | "DG"
  | "RESPONSABLE_PARC"
  | "ASSISTANT_PARC"
  | "CHEF_MAINTENANCE"
  | "ASSISTANT_MAINTENANCE"
  | "CONDUCTEUR"
  | "ADMINISTRATEUR"
  | "COMPTABLE"
  /** Chef de chantier (V64, 2026-09-29) : demande du matériel et tient le journal de ses chantiers. */
  | "CHEF_CHANTIER";

export interface LoginRequest {
  email: string;
  motDePasse: string;
}

export interface LoginResponse {
  token: string;
  role: RoleLibelle;
}

/** Décodé du JWT (voir JwtService côté backend : subject = email, claims idUtilisateur/role). */
export interface SessionUtilisateur {
  email: string;
  idUtilisateur: number;
  role: RoleLibelle;
  /** Expiration en secondes epoch (claim JWT "exp"). */
  expiration: number;
}
