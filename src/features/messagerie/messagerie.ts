import { differenceInCalendarDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Conversation, EvenementTempsReel, MessageConversation, TypeConversation } from "@/types/messagerie";

/**
 * Logique pure de la messagerie (2026-09-28), sans React : regroupement de
 * la liste, dates courtes, contrôle des pièces jointes (miroir des règles du
 * serveur, PiecesJointesMessagerie), temps réel (URL, reconnexion, lecture
 * des événements).
 */

export const LONGUEUR_MAX_MESSAGE = 4000;
export const PIECES_JOINTES_MAX = 5;
export const TAILLE_MAX_PIECE_JOINTE = 10 * 1024 * 1024;
export const TYPES_PIECE_JOINTE = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export interface SectionConversations {
  type: TypeConversation;
  libelle: string;
  conversations: Conversation[];
}

const ORDRE_SECTIONS: { type: TypeConversation; libelle: string }[] = [
  { type: "CANAL", libelle: "Canaux d'équipe" },
  { type: "PRIVEE", libelle: "Messages privés" },
  { type: "FIL", libelle: "Discussions (véhicules, missions…)" },
];

/** Sections non vides, chacune triée du plus récemment actif au plus ancien (jamais actif en dernier). */
export function grouperConversations(conversations: readonly Conversation[], filtre = ""): SectionConversations[] {
  const recherche = filtre.trim().toLowerCase();
  const visibles = recherche ? conversations.filter((c) => c.titre.toLowerCase().includes(recherche)) : conversations;
  return ORDRE_SECTIONS.map(({ type, libelle }) => ({
    type,
    libelle,
    conversations: visibles
      .filter((c) => c.type === type)
      .sort((a, b) => (b.dateDernierMessage ?? "").localeCompare(a.dateDernierMessage ?? "") || a.titre.localeCompare(b.titre, "fr")),
  })).filter((s) => s.conversations.length > 0);
}

export function totalNonLus(conversations: readonly Conversation[]): number {
  return conversations.reduce((n, c) => n + c.nonLus, 0);
}

/** « 14:30 » aujourd'hui, « Hier », sinon « 12/09 » (ou « 12/09/2025 » une autre année). */
export function dateCourte(iso: string | null, maintenant: Date = new Date()): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const jours = differenceInCalendarDays(maintenant, date);
  if (jours === 0) return format(date, "HH:mm");
  if (jours === 1) return "Hier";
  return format(date, date.getFullYear() === maintenant.getFullYear() ? "dd/MM" : "dd/MM/yyyy", { locale: fr });
}

/** « 1,2 Mo », « 350 Ko ». */
export function tailleLisible(octets: number): string {
  if (octets >= 1024 * 1024) return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.max(1, Math.round(octets / 1024))} Ko`;
}

/** Même contrôle que le serveur, pour prévenir avant l'envoi ; null si tout est bon. */
export function verifierPiecesJointes(fichiers: readonly { name: string; type: string; size: number }[]): string | null {
  if (fichiers.length > PIECES_JOINTES_MAX) return `${PIECES_JOINTES_MAX} pièces jointes au maximum par message.`;
  for (const f of fichiers) {
    if (!(TYPES_PIECE_JOINTE as readonly string[]).includes(f.type.toLowerCase())) {
      return `« ${f.name} » : seuls les photos (JPEG, PNG, WEBP) et les PDF sont acceptés.`;
    }
    if (f.size === 0) return `« ${f.name} » est vide.`;
    if (f.size > TAILLE_MAX_PIECE_JOINTE) return `« ${f.name} » dépasse 10 Mo.`;
  }
  return null;
}

/** Ajoute (ou remplace) un message dans une liste chronologique, sans doublon. */
export function fusionnerMessages(
  liste: readonly MessageConversation[],
  nouveaux: readonly MessageConversation[],
): MessageConversation[] {
  const parId = new Map<number, MessageConversation>();
  for (const m of [...liste, ...nouveaux]) parId.set(m.idMessage, m);
  return [...parId.values()].sort((a, b) => a.idMessage - b.idMessage);
}

/** URL WebSocket à partir de l'URL de l'API : http → ws, https → wss. */
export function urlTempsReel(baseApi: string, ticket: string): string {
  const url = new URL("/ws/messagerie", baseApi);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

/** Attente avant la tentative n (0, 1, 2…) : 1 s, 2 s, 4 s… plafonnée à 30 s. */
export function delaiReconnexion(tentative: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.max(0, tentative));
}

/** Lit un événement serveur ; null s'il est inconnu ou mal formé (ex. PONG). */
export function lireEvenement(texte: string): EvenementTempsReel | null {
  try {
    const donnees = JSON.parse(texte) as Partial<EvenementTempsReel>;
    if (donnees?.type === "MESSAGE" && typeof donnees.idConversation === "number" && donnees.message) {
      return donnees as EvenementTempsReel;
    }
  } catch {
    // ignoré
  }
  return null;
}

/** « Hery Rabe » → « HR » ; « Tout le monde » → « TL ». */
export function initialesNom(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  return (mots.slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join("") || "?");
}

/** Page de l'objet d'un fil (lien « Ouvrir » dans l'en-tête de la discussion). */
export function lienObjetFil(type: string | null, idObjet: number | null): string | null {
  if (!type || idObjet === null) return null;
  switch (type) {
    case "ENGIN":
      return `/engins/${idObjet}/rapport`;
    case "CHANTIER":
      return `/chantiers/${idObjet}/fiche`;
    case "MISSION":
      return "/missions";
    case "MAINTENANCE":
      return "/maintenance";
    default:
      return null;
  }
}

/** Heure d'un message : « 14:30 » aujourd'hui, sinon « 12/09 14:30 ». */
export function heureMessage(iso: string, maintenant: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return differenceInCalendarDays(maintenant, date) === 0 ? format(date, "HH:mm") : format(date, "dd/MM HH:mm");
}
