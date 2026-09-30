/** Rapports par e-mail (2026-09-29) — miroir des DTO serveur (package diffusion). */
import type { TypeRapport } from "@/types/rapport";

export type FrequenceEnvoi = "HEBDOMADAIRE" | "MENSUELLE";

export interface AbonnementRapport {
  idAbonnementRapport: number;
  idUtilisateur: number;
  email: string;
  typeRapport: TypeRapport;
  frequence: FrequenceEnvoi;
  actif: boolean;
  dernierePeriodeEnvoyee: string | null;
  /** Null si l'abonnement est suspendu ou l'envoi automatique coupé. */
  prochainEnvoi: string | null;
}

export interface CreerAbonnementRequest {
  idUtilisateur?: number;
  typeRapport: TypeRapport;
  frequence: FrequenceEnvoi;
}

export interface EnvoiRapport {
  idEnvoiRapport: number;
  idUtilisateur: number | null;
  destinataire: string;
  frequence: FrequenceEnvoi | "TEST";
  periodeDebut: string | null;
  periodeFin: string | null;
  typesRapport: TypeRapport[];
  statut: "ENVOYE" | "ECHEC";
  message: string | null;
  dateEnvoi: string;
}

export interface ParametresEnvoiRapports {
  actif: boolean;
  jourSemaine: number;
  jourMois: number;
  heure: number;
  messagerieConfiguree: boolean;
  expediteur: string;
}
