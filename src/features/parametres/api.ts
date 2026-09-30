import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  MettreAJourParametresEntrepriseRequest,
  MettreAJourParametresMapboxRequest,
  MettreAJourParametresTraccarRequest,
  ParametresEntreprise,
  ParametresMapbox,
  ParametresTraccar,
} from "@/types/parametres";

const CLE_PARAMETRES = ["parametres-entreprise"] as const;
const CLE_PARAMETRES_TRACCAR = ["parametres-traccar"] as const;
const CLE_PARAMETRES_MAPBOX = ["parametres-mapbox"] as const;

async function obtenirParametres(): Promise<ParametresEntreprise> {
  const { data } = await apiClient.get<ParametresEntreprise>("/api/parametres/entreprise");
  return data;
}

async function mettreAJourParametres(
  requete: MettreAJourParametresEntrepriseRequest,
): Promise<ParametresEntreprise> {
  const { data } = await apiClient.put<ParametresEntreprise>("/api/parametres/entreprise", requete);
  return data;
}

// Upload initial ou remplacement du logo — action séparée du formulaire principal (même principe
// que photos-api.ts / proforma-api.ts) : un fichier choisi part immédiatement, sans attendre le
// bouton « Enregistrer » qui ne porte que sur les champs texte/TVA.
async function televerserLogo(fichier: File): Promise<ParametresEntreprise> {
  const formData = new FormData();
  formData.append("fichier", fichier);
  // Neutralise le Content-Type JSON par défaut de l'apiClient pour laisser le navigateur poser
  // lui-même l'en-tête multipart/form-data avec sa frontière.
  const { data } = await apiClient.post<ParametresEntreprise>("/api/parametres/entreprise/logo", formData, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

async function supprimerLogo(): Promise<ParametresEntreprise> {
  const { data } = await apiClient.delete<ParametresEntreprise>("/api/parametres/entreprise/logo");
  return data;
}

export function useParametresEntreprise() {
  return useQuery({ queryKey: CLE_PARAMETRES, queryFn: obtenirParametres });
}

export function useMettreAJourParametresEntreprise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mettreAJourParametres,
    onSuccess: (data) => queryClient.setQueryData(CLE_PARAMETRES, data),
  });
}

export function useTeleverserLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: televerserLogo,
    onSuccess: (data) => queryClient.setQueryData(CLE_PARAMETRES, data),
  });
}

export function useSupprimerLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supprimerLogo,
    onSuccess: (data) => queryClient.setQueryData(CLE_PARAMETRES, data),
  });
}

// --- Intégration GPS (Traccar), itération 19 — section séparée des
// paramètres entreprise ci-dessus (endpoint et clé de cache propres),
// même principe de modularité que côté backend (ParametresTraccar séparé
// de ParametresEntreprise).

async function obtenirParametresTraccar(): Promise<ParametresTraccar> {
  const { data } = await apiClient.get<ParametresTraccar>("/api/parametres/traccar");
  return data;
}

async function mettreAJourParametresTraccar(
  requete: MettreAJourParametresTraccarRequest,
): Promise<ParametresTraccar> {
  const { data } = await apiClient.put<ParametresTraccar>("/api/parametres/traccar", requete);
  return data;
}

export function useParametresTraccar() {
  return useQuery({ queryKey: CLE_PARAMETRES_TRACCAR, queryFn: obtenirParametresTraccar });
}

export function useMettreAJourParametresTraccar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mettreAJourParametresTraccar,
    onSuccess: (data) => queryClient.setQueryData(CLE_PARAMETRES_TRACCAR, data),
  });
}

// --- Vue satellite (Mapbox) — section séparée des paramètres Traccar
// ci-dessus (endpoint et clé de cache propres), même principe de modularité
// que côté backend (ParametresMapbox séparé de ParametresTraccar). Remplace
// l'intégration Nimbo (décision du 2026-09-22).

async function obtenirParametresMapbox(): Promise<ParametresMapbox> {
  const { data } = await apiClient.get<ParametresMapbox>("/api/parametres/mapbox");
  return data;
}

async function mettreAJourParametresMapbox(
  requete: MettreAJourParametresMapboxRequest,
): Promise<ParametresMapbox> {
  const { data } = await apiClient.put<ParametresMapbox>("/api/parametres/mapbox", requete);
  return data;
}

export function useParametresMapbox() {
  return useQuery({ queryKey: CLE_PARAMETRES_MAPBOX, queryFn: obtenirParametresMapbox });
}

export function useMettreAJourParametresMapbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mettreAJourParametresMapbox,
    onSuccess: (data) => queryClient.setQueryData(CLE_PARAMETRES_MAPBOX, data),
  });
}
