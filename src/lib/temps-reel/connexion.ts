import type { EtatTempsReel } from "@/lib/temps-reel/etat";
import { commandeAbonner, delaiReconnexion, lireEvenement, urlTempsReel, type EvenementServeur } from "@/lib/temps-reel/protocole";

const INTERVALLE_PING_MS = 30_000;

export interface OptionsConnexion {
  /** Ticket à usage unique (POST /api/temps-reel/ticket, avec le JWT). */
  demanderTicket: () => Promise<string>;
  baseApi: () => string;
  canaux: () => string[];
  surEvenement: (e: EvenementServeur) => void;
  surOuverture: (reconnexion: boolean) => void;
  surEtat: (e: EtatTempsReel) => void;
  creerSocket?: (url: string) => WebSocket;
}

/**
 * Connexion WebSocket unique de l'onglet (2026-09-29) :
 * 1. échange du JWT contre un ticket (30 s, usage unique) ;
 * 2. ouverture de /ws/temps-reel?ticket=… puis abonnement aux canaux ;
 * 3. « ping » toutes les 30 s ;
 * 4. reconnexion automatique 1 s, 2 s, 4 s… (30 s au plus) — le serveur
 *    ferme volontairement une connexion au bout d'une heure, et toute
 *    coupure réseau est rattrapée de la même façon.
 */
export class ConnexionTempsReel {
  private socket: WebSocket | null = null;
  private tentative = 0;
  private arretee = true;
  private dejaOuverte = false;
  private minuteurReconnexion: ReturnType<typeof setTimeout> | undefined;
  private minuteurPing: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly options: OptionsConnexion) {}

  demarrer(): void {
    if (!this.arretee) return;
    this.arretee = false;
    void this.connecter();
  }

  arreter(): void {
    this.arretee = true;
    clearTimeout(this.minuteurReconnexion);
    clearInterval(this.minuteurPing);
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.options.surEtat("hors-ligne");
  }

  private planifierReconnexion(): void {
    clearInterval(this.minuteurPing);
    if (this.arretee) return;
    this.options.surEtat("connexion");
    this.minuteurReconnexion = setTimeout(() => void this.connecter(), delaiReconnexion(this.tentative++));
  }

  private async connecter(): Promise<void> {
    if (this.arretee) return;
    this.options.surEtat("connexion");
    let socket: WebSocket;
    try {
      const ticket = await this.options.demanderTicket();
      if (this.arretee) return;
      const url = urlTempsReel(this.options.baseApi(), ticket);
      socket = this.options.creerSocket ? this.options.creerSocket(url) : new WebSocket(url);
    } catch {
      this.planifierReconnexion();
      return;
    }
    this.socket = socket;
    socket.onopen = () => {
      this.tentative = 0;
      const commande = commandeAbonner(this.options.canaux());
      if (commande) socket.send(commande);
      this.minuteurPing = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send("ping");
      }, INTERVALLE_PING_MS);
      this.options.surEtat("en-direct");
      this.options.surOuverture(this.dejaOuverte);
      this.dejaOuverte = true;
    };
    socket.onmessage = (message) => {
      const evenement = lireEvenement(String(message.data));
      if (evenement) this.options.surEvenement(evenement);
    };
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      this.planifierReconnexion();
    };
  }
}
