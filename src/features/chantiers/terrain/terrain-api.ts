import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  EcheanceChantier,
  EnregistrerMouvementRequest,
  MouvementsVehicule,
  PhotoMouvement,
  TerrainChantier,
  TypeMouvement,
} from "@/types/chantier";

/** Terrain d'un chantier (V64) : présence GPS, sorties / retours, préventif. */
export const terrainKeys = {
  terrain: (id: number) => ["chantiers", "terrain", id] as const,
  mouvements: (id: number) => ["chantiers", "mouvements", id] as const,
  preventif: (id: number) => ["chantiers", "preventif", id] as const,
};

export function useTerrainChantier(idChantier: number, actif = true) {
  return useQuery({
    queryKey: terrainKeys.terrain(idChantier),
    queryFn: async () => (await apiClient.get<TerrainChantier>(`/api/chantiers/${idChantier}/terrain`)).data,
    enabled: actif,
  });
}

export function useRecalculerTerrain(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await apiClient.post<{ joursCalcules: number }>(`/api/chantiers/${idChantier}/terrain/recalculer`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: terrainKeys.terrain(idChantier) }),
  });
}

export function useMouvementsChantier(idChantier: number, actif = true) {
  return useQuery({
    queryKey: terrainKeys.mouvements(idChantier),
    queryFn: async () => (await apiClient.get<MouvementsVehicule[]>(`/api/chantiers/${idChantier}/mouvements`)).data,
    enabled: actif,
  });
}

export function usePreventifChantier(idChantier: number, actif = true) {
  return useQuery({
    queryKey: terrainKeys.preventif(idChantier),
    queryFn: async () => (await apiClient.get<EcheanceChantier[]>(`/api/chantiers/${idChantier}/preventif`)).data,
    enabled: actif,
  });
}

function useRafraichirMouvements(idChantier: number) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: terrainKeys.mouvements(idChantier) });
    // Un retour peut créer un incident ou une maintenance rattachés au chantier.
    void queryClient.invalidateQueries({ queryKey: ["chantiers", "defaillances", idChantier] });
    void queryClient.invalidateQueries({ queryKey: ["chantiers", "couts", idChantier] });
  };
}

export function useEnregistrerMouvement(idChantier: number) {
  const rafraichir = useRafraichirMouvements(idChantier);
  return useMutation({
    mutationFn: async ({ idAffectation, type, requete }: { idAffectation: number; type: TypeMouvement; requete: EnregistrerMouvementRequest }) =>
      (await apiClient.put<MouvementsVehicule>(`/api/affectations-chantier/${idAffectation}/mouvements/${type}`, requete)).data,
    onSuccess: rafraichir,
  });
}

export function useSupprimerMouvement(idChantier: number) {
  const rafraichir = useRafraichirMouvements(idChantier);
  return useMutation({
    mutationFn: async (idMouvement: number) => {
      await apiClient.delete(`/api/mouvements-materiel/${idMouvement}`);
    },
    onSuccess: rafraichir,
  });
}

export function useAjouterPhotoMouvement(idChantier: number) {
  const rafraichir = useRafraichirMouvements(idChantier);
  return useMutation({
    mutationFn: async ({ idMouvement, fichier }: { idMouvement: number; fichier: File }) => {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      const { data } = await apiClient.post<PhotoMouvement>(`/api/mouvements-materiel/${idMouvement}/photos`, donnees, {
        headers: { "Content-Type": undefined },
      });
      return data;
    },
    onSuccess: rafraichir,
  });
}

export function useRetirerPhotoMouvement(idChantier: number) {
  const rafraichir = useRafraichirMouvements(idChantier);
  return useMutation({
    mutationFn: async (idPhoto: number) => {
      await apiClient.delete(`/api/mouvements-materiel/photos/${idPhoto}`);
    },
    onSuccess: rafraichir,
  });
}
