import type { RoleLibelle } from "@/types/auth";

/** Messagerie interne (2026-09-28) — miroir des DTO de backend/.../messagerie/dto. */
export type TypeConversation = "PRIVEE" | "CANAL" | "FIL";
export type TypeObjetFil = "ENGIN" | "MISSION" | "CHANTIER" | "MAINTENANCE";

export interface Contact {
  idUtilisateur: number;
  nomComplet: string;
  role: RoleLibelle | null;
  /** Photo de profil (2026-09-29) ; null = initiales. */
  urlPhoto: string | null;
}

export interface Conversation {
  idConversation: number;
  type: TypeConversation;
  titre: string;
  objetType: TypeObjetFil | null;
  objetId: number | null;
  /** Conversation privée : l'autre participant. */
  interlocuteur: Contact | null;
  dateDernierMessage: string | null;
  nonLus: number;
}

export interface PieceJointe {
  idPieceJointe: number;
  nom: string;
  typeContenu: string;
  taille: number;
  image: boolean;
}

export interface MessageConversation {
  idMessage: number;
  idConversation: number;
  auteur: Contact;
  contenu: string;
  dateEnvoi: string;
  piecesJointes: PieceJointe[];
}

/** Événement poussé par /ws/messagerie. */
export interface EvenementTempsReel {
  type: "MESSAGE";
  idConversation: number;
  message: MessageConversation;
}
