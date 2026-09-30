import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreerElementBordRequest,
  ElementBord,
  EquipementBord,
  ModifierElementBordRequest,
  SaisieEquipementBordRequest,
} from "@/types/equipement-bord";

/** Éléments de bord (sécurité, boîte à outils) — référentiel et état par engin (2026-09-24). */
export const equipementsBordKeys = {
  referentiel: ["elements-bord"] as const,
  engin: (idEngin: number) => ["engins", idEngin, "equipements-bord"] as const,
};

async function listerElementsBord(): Promise<ElementBord[]> {
  const { data } = await apiClient.get<ElementBord[]>("/api/elements-bord");
  return data;
}

async function creerElementBord(requete: CreerElementBordRequest): Promise<ElementBord> {
  const { data } = await apiClient.post<ElementBord>("/api/elements-bord", requete);
  return data;
}

async function modifierElementBord(id: number, requete: ModifierElementBordRequest): Promise<ElementBord> {
  const { data } = await apiClient.put<ElementBord>(`/api/elements-bord/${id}`, requete);
  return data;
}

// @RequestParam côté backend, pas un corps JSON (même convention que les autres activations).
async function changerActivationElementBord(id: number, actif: boolean): Promise<ElementBord> {
  const { data } = await apiClient.patch<ElementBord>(`/api/elements-bord/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

async function listerEquipementsBord(idEngin: number): Promise<EquipementBord[]> {
  const { data } = await apiClient.get<EquipementBord[]>(`/api/engins/${idEngin}/equipements-bord`);
  return data;
}

async function mettreAJourEquipementsBord(idEngin: number, saisies: SaisieEquipementBordRequest[]): Promise<EquipementBord[]> {
  const { data } = await apiClient.put<EquipementBord[]>(`/api/engins/${idEngin}/equipements-bord`, saisies);
  return data;
}

export function useElementsBord() {
  return useQuery({ queryKey: equipementsBordKeys.referentiel, queryFn: listerElementsBord, staleTime: 5 * 60_000 });
}

export function useCreerElementBord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerElementBord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: equipementsBordKeys.referentiel }),
  });
}

export function useModifierElementBord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierElementBordRequest }) => modifierElementBord(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: equipementsBordKeys.referentiel }),
  });
}

export function useChangerActivationElementBord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationElementBord(id, actif),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: equipementsBordKeys.referentiel }),
  });
}

export function useEquipementsBord(idEngin: number | undefined) {
  return useQuery({
    queryKey: equipementsBordKeys.engin(idEngin ?? 0),
    queryFn: () => listerEquipementsBord(idEngin!),
    enabled: idEngin != null,
  });
}

/** Met directement le cache à jour avec la réponse (liste complète renvoyée par le backend). */
export function useMettreAJourEquipementsBord(idEngin: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (saisies: SaisieEquipementBordRequest[]) => mettreAJourEquipementsBord(idEngin, saisies),
    onSuccess: (donnees) => queryClient.setQueryData(equipementsBordKeys.engin(idEngin), donnees),
  });
}
