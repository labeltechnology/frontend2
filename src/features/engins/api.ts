import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { documentsKeys } from "@/features/documents/api";
import type {
  CreerEnginRequest,
  CreerTypeEnginRequest,
  Engin,
  ModifierEnginRequest,
  ModifierTypeEnginRequest,
  StatutEngin,
  TypeEngin,
} from "@/types/engin";

export const enginsKeys = {
  liste: ["engins"] as const,
  detail: (id: number) => ["engins", id] as const,
};

const CLE_TYPES_ENGIN = ["types-engin"] as const;

async function listerEngins(): Promise<Engin[]> {
  const { data } = await apiClient.get<Engin[]>("/api/engins");
  return data;
}

async function creerEngin(requete: CreerEnginRequest): Promise<Engin> {
  const { data } = await apiClient.post<Engin>("/api/engins", requete);
  return data;
}

async function modifierEngin(id: number, requete: ModifierEnginRequest): Promise<Engin> {
  const { data } = await apiClient.put<Engin>(`/api/engins/${id}`, requete);
  return data;
}

// Ces trois endpoints attendent leur valeur en paramètre de requête
// (@RequestParam côté EnginController), pas en corps JSON.
async function changerStatutEngin(id: number, statut: StatutEngin): Promise<Engin> {
  const { data } = await apiClient.patch<Engin>(`/api/engins/${id}/statut`, null, {
    params: { valeur: statut },
  });
  return data;
}

async function mettreAJourKilometrageEngin(id: number, nouveauKm: number): Promise<Engin> {
  const { data } = await apiClient.patch<Engin>(`/api/engins/${id}/kilometrage`, null, {
    params: { valeur: nouveauKm },
  });
  return data;
}

async function equiperGpsEngin(id: number, equipe: boolean): Promise<Engin> {
  const { data } = await apiClient.patch<Engin>(`/api/engins/${id}/gps`, null, {
    params: { equipe },
  });
  return data;
}

// Règle 7.4 : lien engin <-> zone d'opération autorisée (plusieurs zones possibles par véhicule).
async function assignerZoneOperation(idEngin: number, idZone: number): Promise<Engin> {
  const { data } = await apiClient.post<Engin>(`/api/engins/${idEngin}/zones-operation/${idZone}`);
  return data;
}

async function retirerZoneOperation(idEngin: number, idZone: number): Promise<Engin> {
  const { data } = await apiClient.delete<Engin>(`/api/engins/${idEngin}/zones-operation/${idZone}`);
  return data;
}

export function useEngins() {
  return useQuery({ queryKey: enginsKeys.liste, queryFn: listerEngins });
}

export function useCreerEngin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerEngin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enginsKeys.liste });
      // Depuis le 2026-09-24, la fiche de création peut aussi enregistrer carte
      // grise / assurance / visite technique (même transaction côté backend).
      queryClient.invalidateQueries({ queryKey: documentsKeys.liste });
    },
  });
}

export function useModifierEngin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierEnginRequest }) => modifierEngin(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enginsKeys.liste }),
  });
}

export function useChangerStatutEngin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }: { id: number; statut: StatutEngin }) => changerStatutEngin(id, statut),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enginsKeys.liste }),
  });
}

export function useMettreAJourKilometrage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nouveauKm }: { id: number; nouveauKm: number }) => mettreAJourKilometrageEngin(id, nouveauKm),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enginsKeys.liste }),
  });
}

export function useEquiperGps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, equipe }: { id: number; equipe: boolean }) => equiperGpsEngin(id, equipe),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enginsKeys.liste }),
  });
}

export function useAssignerZoneOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEngin, idZone }: { idEngin: number; idZone: number }) => assignerZoneOperation(idEngin, idZone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enginsKeys.liste }),
  });
}

export function useRetirerZoneOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idEngin, idZone }: { idEngin: number; idZone: number }) => retirerZoneOperation(idEngin, idZone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: enginsKeys.liste }),
  });
}

// --- Types d'engins (référentiel, utilisé par le formulaire de création) ---

async function listerTypesEngin(): Promise<TypeEngin[]> {
  const { data } = await apiClient.get<TypeEngin[]>("/api/types-engin");
  return data;
}

export function useTypesEngin() {
  return useQuery({ queryKey: CLE_TYPES_ENGIN, queryFn: listerTypesEngin, staleTime: 5 * 60_000 });
}

// --- Écran "Types de véhicule" (CRUD + activation, ajouté le 2026-09-22) ---

async function creerTypeEngin(requete: CreerTypeEnginRequest): Promise<TypeEngin> {
  const { data } = await apiClient.post<TypeEngin>("/api/types-engin", requete);
  return data;
}

async function modifierTypeEngin(id: number, requete: ModifierTypeEnginRequest): Promise<TypeEngin> {
  const { data } = await apiClient.put<TypeEngin>(`/api/types-engin/${id}`, requete);
  return data;
}

async function changerActivationTypeEngin(id: number, actif: boolean): Promise<TypeEngin> {
  const { data } = await apiClient.patch<TypeEngin>(`/api/types-engin/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

export function useCreerTypeEngin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerTypeEngin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_TYPES_ENGIN }),
  });
}

export function useModifierTypeEngin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierTypeEnginRequest }) => modifierTypeEngin(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_TYPES_ENGIN }),
  });
}

export function useChangerActivationTypeEngin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationTypeEngin(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLE_TYPES_ENGIN }),
  });
}
