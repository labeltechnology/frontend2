/**
 * Protocole de la connexion temps réel (2026-09-29) — logique pure, testée.
 *
 * Le serveur pousse :
 * - CHANGEMENT : un objet d'un canal a changé (données complètes, relues avec
 *   les droits du destinataire, ou simple signal quand elles manquent) ;
 * - ABONNE : réponse à un abonnement (canaux acceptés / refusés) ;
 * - MESSAGE : nouveau message de messagerie (format inchangé depuis 2026-09-28) ;
 * - PONG : réponse au ping.
 * Le client n'envoie que « ping », « abonner:a,b » et « desabonner:a,b ».
 */

export type OperationChangement = "CREE" | "MODIFIE" | "SUPPRIME";

export interface EvenementChangement {
  type: "CHANGEMENT";
  canal: string;
  /** null : tout le canal est à recharger. */
  id: number | null;
  operation: OperationChangement;
  /** Objet tel que GET /api/…/{id} le renvoie au destinataire ; null = simple signal. */
  donnees: unknown;
  auteur: { id: number; nom: string | null } | null;
  /** Onglet d'origine (en-tête X-Onglet-Id), null pour une tâche du serveur. */
  onglet: string | null;
  horodatage: string;
}

export interface EvenementAbonne {
  type: "ABONNE";
  canaux: string[];
  refuses: string[];
}

export interface EvenementMessage {
  type: "MESSAGE";
  idConversation: number;
  message: unknown;
}

export type EvenementServeur = EvenementChangement | EvenementAbonne | EvenementMessage;

const OPERATIONS: readonly string[] = ["CREE", "MODIFIE", "SUPPRIME"];
const NOM_CANAL = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** URL WebSocket à partir de l'URL de l'API : http → ws, https → wss. */
export function urlTempsReel(baseApi: string, ticket: string): string {
  const url = new URL("/ws/temps-reel", baseApi);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

/** Attente avant la tentative n (0, 1, 2…) : 1 s, 2 s, 4 s… plafonnée à 30 s. */
export function delaiReconnexion(tentative: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.max(0, tentative));
}

/** Commande d'abonnement ; null si aucun nom valide. */
export function commandeAbonner(canaux: readonly string[]): string | null {
  const valides = [...new Set(canaux.filter((c) => NOM_CANAL.test(c)))];
  return valides.length > 0 ? `abonner:${valides.join(",")}` : null;
}

function estNombreOuNull(v: unknown): v is number | null {
  return v === null || (typeof v === "number" && Number.isFinite(v));
}

/** Lit un message du serveur ; null s'il est inconnu ou mal formé (ex. PONG). */
export function lireEvenement(texte: string): EvenementServeur | null {
  let d: Record<string, unknown>;
  try {
    const brut: unknown = JSON.parse(texte);
    if (!brut || typeof brut !== "object") return null;
    d = brut as Record<string, unknown>;
  } catch {
    return null;
  }
  switch (d.type) {
    case "CHANGEMENT":
      if (typeof d.canal !== "string" || !estNombreOuNull(d.id ?? null) || !OPERATIONS.includes(String(d.operation))) {
        return null;
      }
      return {
        type: "CHANGEMENT",
        canal: d.canal,
        id: (d.id as number | null | undefined) ?? null,
        operation: d.operation as OperationChangement,
        donnees: d.donnees ?? null,
        auteur:
          d.auteur && typeof d.auteur === "object" && typeof (d.auteur as { id?: unknown }).id === "number"
            ? (d.auteur as { id: number; nom: string | null })
            : null,
        onglet: typeof d.onglet === "string" ? d.onglet : null,
        horodatage: typeof d.horodatage === "string" ? d.horodatage : "",
      };
    case "ABONNE":
      return Array.isArray(d.canaux) && Array.isArray(d.refuses)
        ? { type: "ABONNE", canaux: d.canaux.map(String), refuses: d.refuses.map(String) }
        : null;
    case "MESSAGE":
      return typeof d.idConversation === "number" && d.message
        ? { type: "MESSAGE", idConversation: d.idConversation, message: d.message }
        : null;
    default:
      return null;
  }
}
