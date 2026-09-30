/** Webhooks des alertes critiques (2026-09-29) — miroir des DTO serveur. */
export interface Webhook {
  idWebhook: number;
  nom: string;
  url: string;
  actif: boolean;
  chiffre: boolean;
  secretMasque: string;
  /** Seulement juste après la création ou le renouvellement : à copier aussitôt. */
  secret: string | null;
}

export interface LivraisonWebhook {
  idLivraisonWebhook: number;
  evenement: string;
  idAlerte: number | null;
  tentative: number;
  succes: boolean;
  statutHttp: number | null;
  dureeMs: number | null;
  message: string | null;
  dateLivraison: string;
}
