import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreerPosteEntretienRequest,
  EcheanceEntretien,
  InterventionEntretienRequest,
  ModifierPosteEntretienRequest,
  PosteEntretien,
} from "@/types/entretien";

/** Échéancier d'entretien — référentiel des postes et échéances par engin (2026-09-24). */
export const entretienKeys = {
  postes: ["postes-entretien"] as const,
  /** Préfixe commun : invalider après un changement d'intervalle recalcule toutes les échéances. */
  echeances: ["echeances-entretien"] as const,
  echeancesEngin: (idEngin: number) => ["echeances-entretien", idEngin] as const,
};

async function listerPostes(): Promise<PosteEntretien[]> {
  const { data } = await apiClient.get<PosteEntretien[]>("/api/postes-entretien");
  return data;
}

async function creerPoste(requete: CreerPosteEntretienRequest): Promise<PosteEntretien> {
  const { data } = await apiClient.post<PosteEntretien>("/api/postes-entretien", requete);
  return data;
}

async function modifierPoste(id: number, requete: ModifierPosteEntretienRequest): Promise<PosteEntretien> {
  const { data } = await apiClient.put<PosteEntretien>(`/api/postes-entretien/${id}`, requete);
  return data;
}

async function changerActivationPoste(id: number, actif: boolean): Promise<PosteEntretien> {
  const { data } = await apiClient.patch<PosteEntretien>(`/api/postes-entretien/${id}/activation`, null, {
    params: { actif },
  });
  return data;
}

async function listerEcheances(idEngin: number): Promise<EcheanceEntretien[]> {
  const { data } = await apiClient.get<EcheanceEntretien[]>(`/api/engins/${idEngin}/echeances-entretien`);
  return data;
}

async function enregistrerIntervention(
  idEngin: number,
  idPosteEntretien: number,
  requete: InterventionEntretienRequest,
): Promise<EcheanceEntretien[]> {
  const { data } = await apiClient.post<EcheanceEntretien[]>(
    `/api/engins/${idEngin}/echeances-entretien/${idPosteEntretien}/interventions`,
    requete,
  );
  return data;
}

export function usePostesEntretien() {
  return useQuery({ queryKey: entretienKeys.postes, queryFn: listerPostes, staleTime: 5 * 60_000 });
}

export function useCreerPosteEntretien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerPoste,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: entretienKeys.postes }),
  });
}

export function useModifierPosteEntretien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: ModifierPosteEntretienRequest }) => modifierPoste(id, requete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entretienKeys.postes });
      // Le backend recalcule les échéances quand un intervalle change.
      queryClient.invalidateQueries({ queryKey: entretienKeys.echeances });
    },
  });
}

export function useChangerActivationPosteEntretien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) => changerActivationPoste(id, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entretienKeys.postes });
      queryClient.invalidateQueries({ queryKey: entretienKeys.echeances });
    },
  });
}

export function useEcheancesEntretien(idEngin: number | undefined) {
  return useQuery({
    queryKey: entretienKeys.echeancesEngin(idEngin ?? 0),
    queryFn: () => listerEcheances(idEngin!),
    enabled: idEngin != null,
  });
}

export function useEnregistrerIntervention(idEngin: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idPosteEntretien, requete }: { idPosteEntretien: number; requete: InterventionEntretienRequest }) =>
      enregistrerIntervention(idEngin, idPosteEntretien, requete),
    onSuccess: (donnees) => queryClient.setQueryData(entretienKeys.echeancesEngin(idEngin), donnees),
  });
}
