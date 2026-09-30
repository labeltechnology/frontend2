import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  EnregistrerTypeChantierRequest,
  ReserveCritique,
  ResponsableChantier,
  TypeChantier,
} from "@/types/chantier";

/** Organisation des chantiers (V64) — types de chantier, responsables possibles, véhicules réservés. */
export const organisationKeys = {
  types: ["chantiers", "types-chantier"] as const,
  responsables: ["chantiers", "responsables-possibles"] as const,
  reserves: ["chantiers", "reserves-critiques"] as const,
};

export function useTypesChantier() {
  return useQuery({
    queryKey: organisationKeys.types,
    queryFn: async () => (await apiClient.get<TypeChantier[]>("/api/types-chantier")).data,
    staleTime: 5 * 60_000,
  });
}

export function useEnregistrerTypeChantier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, requete }: { id?: number; requete: EnregistrerTypeChantierRequest }) =>
      id
        ? (await apiClient.put<TypeChantier>(`/api/types-chantier/${id}`, requete)).data
        : (await apiClient.post<TypeChantier>("/api/types-chantier", requete)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organisationKeys.types }),
  });
}

export function useResponsablesPossibles(actif: boolean) {
  return useQuery({
    queryKey: organisationKeys.responsables,
    queryFn: async () => (await apiClient.get<ResponsableChantier[]>("/api/chantiers/responsables-possibles")).data,
    enabled: actif,
  });
}

export function useReservesCritiques() {
  return useQuery({
    queryKey: organisationKeys.reserves,
    queryFn: async () => (await apiClient.get<ReserveCritique[]>("/api/engins-reserves-critiques")).data,
  });
}

export function useReserverEngin() {
  const queryClient = useQueryClient();
  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: organisationKeys.reserves });
    void queryClient.invalidateQueries({ queryKey: ["fiche-chantier"] });
  };
  return {
    reserver: useMutation({
      mutationFn: async ({ idEngin, motif }: { idEngin: number; motif?: string }) =>
        (await apiClient.put<ReserveCritique>("/api/engins-reserves-critiques", { idEngin, motif })).data,
      onSuccess: rafraichir,
    }),
    liberer: useMutation({
      mutationFn: async (idEngin: number) => {
        await apiClient.delete(`/api/engins-reserves-critiques/${idEngin}`);
      },
      onSuccess: rafraichir,
    }),
  };
}
