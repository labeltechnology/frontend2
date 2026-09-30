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

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
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
