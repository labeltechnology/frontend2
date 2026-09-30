import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AffectationChantier,
  AffectationConducteurChantier,
  BesoinMaterielChantier,
  Chantier,
  CreerAffectationChantierRequest,
  CreerAffectationConducteurChantierRequest,
  CreerBesoinMaterielChantierRequest,
  CreerChantierRequest,
  CreerZoneChantierRequest,
  ModifierBesoinMaterielChantierRequest,
  ModifierChantierRequest,
  ModifierZoneChantierRequest,
  ZoneChantier,
} from "@/types/chantier";

export const chantiersKeys = {
  liste: ["chantiers"] as const,
};

export const affectationsChantierKeys = {
  parChantier: (idChantier: number) => ["affectations-chantier", idChantier] as const,
};

export const affectationsConducteurChantierKeys = {
  parChantier: (idChantier: number) => ["affectations-conducteur-chantier", idChantier] as const,
};

export const besoinsMaterielChantierKeys = {
  parChantier: (idChantier: number) => ["besoins-materiel-chantier", idChantier] as const,
};

export const zonesChantierKeys = {
  parChantier: (idChantier: number) => ["zones-chantier", idChantier] as const,
};

// ---- Chantiers -------------------------------------------------------

async function listerChantiers(): Promise<Chantier[]> {
  const { data } = await apiClient.get<Chantier[]>("/api/chantiers");
  return data;
}

async function creerChantier(requete: CreerChantierRequest): Promise<Chantier> {
  const { data } = await apiClient.post<Chantier>("/api/chantiers", requete);
  return data;
}

async function modifierChantier(id: number, requete: ModifierChantierRequest): Promise<Chantier> {
  const { data } = await apiClient.put<Chantier>(`/api/chantiers/${id}`, requete);
  return data;
}

async function demarrerChantier(id: number): Promise<Chantier> {
  const { data } = await apiClient.patch<Chantier>(`/api/chantiers/${id}/demarrer`);
  return data;
}

async function terminerChantier(id: number): Promise<Chantier> {
  const { data } = await apiClient.patch<Chantier>(`/api/chantiers/${id}/terminer`);
  return data;
}

async function annulerChantier(id: number, motifAnnulation: string): Promise<Chantier> {
  const { data } = await apiClient.patch<Chantier>(`/api/chantiers/${id}/annuler`, null, {
    params: { motifAnnulation },
  });
  return data;
}

export function useChantiers() {
  return useQuery({ queryKey: chantiersKeys.liste, queryFn: listerChantiers });
}

export function useCreerChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerChantier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chantiersKeys.liste }),
  });
}

export function useModifierChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierChantierRequest }) => modifierChantier(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chantiersKeys.liste }),
  });
}

export function useDemarrerChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: demarrerChantier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chantiersKeys.liste }),
  });
}

export function useTerminerChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminerChantier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chantiersKeys.liste }),
  });
}

export function useAnnulerChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifAnnulation }: { id: number; motifAnnulation: string }) =>
      annulerChantier(id, motifAnnulation),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chantiersKeys.liste }),
  });
}

// ---- Rattachements engin <-> chantier ---------------------------------

async function listerAffectationsChantier(idChantier: number): Promise<AffectationChantier[]> {
  const { data } = await apiClient.get<AffectationChantier[]>("/api/affectations-chantier", {
    params: { idChantier },
  });
  return data;
}

async function creerAffectationChantier(requete: CreerAffectationChantierRequest): Promise<AffectationChantier> {
  const { data } = await apiClient.post<AffectationChantier>("/api/affectations-chantier", requete);
  return data;
}

async function terminerAffectationChantier(id: number): Promise<AffectationChantier> {
  const { data } = await apiClient.patch<AffectationChantier>(`/api/affectations-chantier/${id}/terminer`);
  return data;
}

async function annulerAffectationChantier(id: number, motifAnnulation: string): Promise<AffectationChantier> {
  const { data } = await apiClient.patch<AffectationChantier>(`/api/affectations-chantier/${id}/annuler`, null, {
    params: { motifAnnulation },
  });
  return data;
}

export function useAffectationsChantier(idChantier: number | undefined) {
  return useQuery({
    queryKey: affectationsChantierKeys.parChantier(idChantier ?? 0),
    queryFn: () => listerAffectationsChantier(idChantier as number),
    enabled: idChantier !== undefined,
  });
}

/**
 * Rattachements engin<->chantier de TOUS les chantiers en une fois — même
 * patron que {@link useZonesTousChantiers} (pas d'endpoint dédié "par
 * engin", une requête par chantier en parallèle). Utilisé par le calendrier
 * d'un véhicule (EnginsPage.tsx, demande explicite de l'utilisateur), qui
 * filtre ensuite côté client sur l'engin choisi.
 */
export function useAffectationsChantierTousChantiers(chantiers: Chantier[] | undefined) {
  return useQueries({
    queries: (chantiers ?? []).map((chantier) => ({
      queryKey: affectationsChantierKeys.parChantier(chantier.idChantier),
      queryFn: () => listerAffectationsChantier(chantier.idChantier),
      enabled: chantiers !== undefined,
    })),
  });
}

export function useCreerAffectationChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerAffectationChantier,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: affectationsChantierKeys.parChantier(variables.idChantier) }),
  });
}

export function useTerminerAffectationChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminerAffectationChantier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: affectationsChantierKeys.parChantier(idChantier) }),
  });
}

export function useAnnulerAffectationChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifAnnulation }: { id: number; motifAnnulation: string }) =>
      annulerAffectationChantier(id, motifAnnulation),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: affectationsChantierKeys.parChantier(idChantier) }),
  });
}

// ---- Rattachements conducteur <-> chantier ----------------------------
// Voir AffectationConducteurChantierDialog.tsx : contrairement au rattachement
// véhicule, un conducteur peut être actif sur plusieurs chantiers à la fois
// (demande explicite de l'utilisateur, 2026-09-23) — aucune donnée
// particulière n'en découle côté frontend, la liste renvoyée par le backend
// reflète simplement tous les rattachements actifs du conducteur, sans
// filtrage d'exclusivité.

async function listerAffectationsConducteurChantier(idChantier: number): Promise<AffectationConducteurChantier[]> {
  const { data } = await apiClient.get<AffectationConducteurChantier[]>("/api/affectations-conducteur-chantier", {
    params: { idChantier },
  });
  return data;
}

async function creerAffectationConducteurChantier(
  requete: CreerAffectationConducteurChantierRequest,
): Promise<AffectationConducteurChantier> {
  const { data } = await apiClient.post<AffectationConducteurChantier>(
    "/api/affectations-conducteur-chantier",
    requete,
  );
  return data;
}

async function terminerAffectationConducteurChantier(id: number): Promise<AffectationConducteurChantier> {
  const { data } = await apiClient.patch<AffectationConducteurChantier>(
    `/api/affectations-conducteur-chantier/${id}/terminer`,
  );
  return data;
}

async function annulerAffectationConducteurChantier(
  id: number,
  motifAnnulation: string,
): Promise<AffectationConducteurChantier> {
  const { data } = await apiClient.patch<AffectationConducteurChantier>(
    `/api/affectations-conducteur-chantier/${id}/annuler`,
    null,
    { params: { motifAnnulation } },
  );
  return data;
}

export function useAffectationsConducteurChantier(idChantier: number | undefined) {
  return useQuery({
    queryKey: affectationsConducteurChantierKeys.parChantier(idChantier ?? 0),
    queryFn: () => listerAffectationsConducteurChantier(idChantier as number),
    enabled: idChantier !== undefined,
  });
}

/**
 * Rattachements conducteur<->chantier de TOUS les chantiers en une fois —
 * même patron que {@link useZonesTousChantiers}. Utilisé par le calendrier
 * d'un conducteur (ConducteursPage.tsx, demande explicite de l'utilisateur :
 * « une calendrier de mission pour le conducteur en fonction des chantiers »),
 * qui filtre ensuite côté client sur le conducteur choisi.
 */
export function useAffectationsConducteurChantierTousChantiers(chantiers: Chantier[] | undefined) {
  return useQueries({
    queries: (chantiers ?? []).map((chantier) => ({
      queryKey: affectationsConducteurChantierKeys.parChantier(chantier.idChantier),
      queryFn: () => listerAffectationsConducteurChantier(chantier.idChantier),
      enabled: chantiers !== undefined,
    })),
  });
}

export function useCreerAffectationConducteurChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerAffectationConducteurChantier,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: affectationsConducteurChantierKeys.parChantier(variables.idChantier),
      }),
  });
}

export function useTerminerAffectationConducteurChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminerAffectationConducteurChantier,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: affectationsConducteurChantierKeys.parChantier(idChantier) }),
  });
}

export function useAnnulerAffectationConducteurChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motifAnnulation }: { id: number; motifAnnulation: string }) =>
      annulerAffectationConducteurChantier(id, motifAnnulation),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: affectationsConducteurChantierKeys.parChantier(idChantier) }),
  });
}

// ---- Besoins en matériel (type d'engin/véhicule + quantité) -----------
// Voir BesoinMaterielChantierDialog.tsx et ChantierFormDialog.tsx : la
// disponibilité prévisionnelle (quantiteDisponiblePrevisionnelle) est
// calculée côté backend, jamais côté frontend.

async function listerBesoinsMaterielChantier(idChantier: number): Promise<BesoinMaterielChantier[]> {
  const { data } = await apiClient.get<BesoinMaterielChantier[]>("/api/besoins-materiel-chantier", {
    params: { idChantier },
  });
  return data;
}

async function creerBesoinMaterielChantier(
  requete: CreerBesoinMaterielChantierRequest,
): Promise<BesoinMaterielChantier> {
  const { data } = await apiClient.post<BesoinMaterielChantier>("/api/besoins-materiel-chantier", requete);
  return data;
}

async function modifierBesoinMaterielChantier(
  id: number,
  requete: ModifierBesoinMaterielChantierRequest,
): Promise<BesoinMaterielChantier> {
  const { data } = await apiClient.put<BesoinMaterielChantier>(`/api/besoins-materiel-chantier/${id}`, requete);
  return data;
}

async function supprimerBesoinMaterielChantier(id: number): Promise<void> {
  await apiClient.delete(`/api/besoins-materiel-chantier/${id}`);
}

export function useBesoinsMaterielChantier(idChantier: number | undefined) {
  return useQuery({
    queryKey: besoinsMaterielChantierKeys.parChantier(idChantier ?? 0),
    queryFn: () => listerBesoinsMaterielChantier(idChantier as number),
    enabled: idChantier !== undefined,
  });
}

export function useCreerBesoinMaterielChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerBesoinMaterielChantier,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: besoinsMaterielChantierKeys.parChantier(variables.idChantier) }),
  });
}

export function useModifierBesoinMaterielChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierBesoinMaterielChantierRequest }) =>
      modifierBesoinMaterielChantier(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: besoinsMaterielChantierKeys.parChantier(idChantier) }),
  });
}

export function useSupprimerBesoinMaterielChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supprimerBesoinMaterielChantier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: besoinsMaterielChantierKeys.parChantier(idChantier) }),
  });
}

// ---- Zones du chantier (carte OpenStreetMap) ---------------------------

async function listerZonesChantier(idChantier: number): Promise<ZoneChantier[]> {
  const { data } = await apiClient.get<ZoneChantier[]>("/api/zones-chantier", { params: { idChantier } });
  return data;
}

async function creerZoneChantier(requete: CreerZoneChantierRequest): Promise<ZoneChantier> {
  const { data } = await apiClient.post<ZoneChantier>("/api/zones-chantier", requete);
  return data;
}

async function modifierZoneChantier(id: number, requete: ModifierZoneChantierRequest): Promise<ZoneChantier> {
  const { data } = await apiClient.put<ZoneChantier>(`/api/zones-chantier/${id}`, requete);
  return data;
}

async function supprimerZoneChantier(id: number): Promise<void> {
  await apiClient.delete(`/api/zones-chantier/${id}`);
}

export function useZonesChantier(idChantier: number | undefined) {
  return useQuery({
    queryKey: zonesChantierKeys.parChantier(idChantier ?? 0),
    queryFn: () => listerZonesChantier(idChantier as number),
    enabled: idChantier !== undefined,
  });
}

/**
 * Zones de TOUS les chantiers en une fois, pour la carte d'ensemble
 * (ChantiersMap.tsx) : pas d'endpoint backend dédié pour "toutes les zones
 * de tous les chantiers" (celui existant filtre toujours par idChantier,
 * comme la plupart des listes de ce projet — voir /api/gps/positions vs
 * /api/gps/positions/flotte), donc on interroge en parallèle une requête
 * par chantier via useQueries plutôt que d'ajouter un nouvel endpoint pour
 * un seul écran de consultation. Résultat dans le même ordre que `chantiers`.
 */
export function useZonesTousChantiers(chantiers: Chantier[] | undefined) {
  return useQueries({
    queries: (chantiers ?? []).map((chantier) => ({
      queryKey: zonesChantierKeys.parChantier(chantier.idChantier),
      queryFn: () => listerZonesChantier(chantier.idChantier),
      enabled: chantiers !== undefined,
    })),
  });
}

export function useCreerZoneChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerZoneChantier,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: zonesChantierKeys.parChantier(variables.idChantier) }),
  });
}

export function useModifierZoneChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierZoneChantierRequest }) =>
      modifierZoneChantier(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zonesChantierKeys.parChantier(idChantier) }),
  });
}

export function useSupprimerZoneChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supprimerZoneChantier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: zonesChantierKeys.parChantier(idChantier) }),
  });
}
