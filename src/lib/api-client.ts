import axios, { AxiosError } from "axios";
import { effacerToken, lireTokenStocke } from "@/lib/auth-storage";
import { ENTETE_ONGLET, ID_ONGLET } from "@/lib/temps-reel/onglet";

/** Forme JSON uniforme de toute erreur renvoyée par l'API (voir ApiErrorResponse côté backend). */
export interface ApiErrorResponse {
  horodatage: string;
  statut: number;
  erreur: string;
  message: string;
  details: string[];
}

export class ApiError extends Error {
  readonly statut: number;
  readonly details: string[];

  constructor(reponse: ApiErrorResponse) {
    super(reponse.message);
    this.name = "ApiError";
    this.statut = reponse.statut;
    this.details = reponse.details ?? [];
  }
}

/**
 * Racine de l'API.
 *
 *  - Valeur fournie (ex. « https://api.exemple.mg ») : utilisée telle quelle.
 *  - Vide ou absente EN PRODUCTION : chaîne vide = **même origine que la
 *    page**. C'est le montage recommandé sur un VPS — le serveur web sert le
 *    frontend et relaie /api et /ws vers le backend : ni CORS à configurer,
 *    ni contenu mixte, et le même build fonctionne sur n'importe quel domaine.
 *  - Absente EN DÉVELOPPEMENT : le backend tourne à part, sur le port 8080.
 *
 * L'URL du temps réel en découle (voir protocole.ts, urlTempsReel), avec
 * bascule http→ws et https→wss automatique.
 */
const RACINE_API = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8080" : "");

export const apiClient = axios.create({
  baseURL: RACINE_API,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = lireTokenStocke();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Onglet d'origine (2026-09-29) : le temps réel reconnaît ainsi les modifications faites ici.
  config.headers[ENTETE_ONGLET] = ID_ONGLET;
  return config;
});

/**
 * Uniformise les erreurs : une réponse d'erreur du backend (ApiErrorResponse)
 * devient une {@link ApiError} avec un message lisible ; toute autre panne
 * (réseau, backend inaccessible) devient un message générique. Une session
 * expirée/invalide (401) efface le token stocké — l'appelant (garde de
 * route) redirigera vers la page de connexion au prochain rendu.
 */
apiClient.interceptors.response.use(
  (reponse) => reponse,
  async (erreur: AxiosError<ApiErrorResponse>) => {
    if (erreur.response?.status === 401) {
      effacerToken();
    }
    // Sur une requête `responseType: "blob"` (aperçus/exports PDF), le corps
    // d'erreur arrive lui aussi en Blob : il faut le relire en texte pour
    // retrouver l'ApiErrorResponse, sinon le message du backend est perdu.
    if (erreur.response?.data instanceof Blob) {
      try {
        const json = JSON.parse(await erreur.response.data.text()) as ApiErrorResponse;
        if (json && typeof json === "object" && "message" in json) {
          return Promise.reject(new ApiError(json));
        }
      } catch {
        // corps non-JSON : on retombe sur le traitement générique ci-dessous
      }
    }
    if (erreur.response?.data && typeof erreur.response.data === "object" && "message" in erreur.response.data) {
      return Promise.reject(new ApiError(erreur.response.data));
    }
    if (erreur.request && !erreur.response) {
      return Promise.reject(
        new ApiError({
          horodatage: new Date().toISOString(),
          statut: 0,
          erreur: "RESEAU",
          message: "Impossible de contacter le serveur — vérifie qu'il est démarré et accessible.",
          details: [],
        }),
      );
    }
    return Promise.reject(erreur);
  },
);
