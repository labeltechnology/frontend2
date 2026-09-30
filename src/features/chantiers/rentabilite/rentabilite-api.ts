import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RentabiliteChantier, TarifRefacturation, UniteTarif } from "@/types/chantier";

/** Rentabilité et tarifs (V64) — RentabiliteChantierController. */
export const rentabiliteKeys = {
  chantier: (id: number) => ["chantiers", "rentabilite", id] as const,
  classement: ["chantiers", "classement"] as const,
  tarifs: ["chantiers", "tarifs-refacturation"] as const,
};

export function useRentabiliteChantier(idChantier: number, actif = true) {
  return useQuery({
    queryKey: rentabiliteKeys.chantier(idChantier),
    queryFn: async () => (await apiClient.get<RentabiliteChantier>(`/api/chantiers/${idChantier}/rentabilite`)).data,
    enabled: actif,
  });
}

export function useClassementChantiers(actif = true) {
  return useQuery({
    queryKey: rentabiliteKeys.classement,
    queryFn: async () => (await apiClient.get<RentabiliteChantier[]>("/api/chantiers/classement")).data,
    enabled: actif,
  });
}

export function useTarifsRefacturation(actif = true) {
  return useQuery({
    queryKey: rentabiliteKeys.tarifs,
    queryFn: async () => (await apiClient.get<TarifRefacturation[]>("/api/tarifs-refacturation")).data,
    enabled: actif,
  });
}

export function useEnregistrerTarif() {
  const queryClient = useQueryClient();
  const rafraichir = () => {
    void queryClient.invalidateQueries({ queryKey: rentabiliteKeys.tarifs });
    void queryClient.invalidateQueries({ queryKey: ["chantiers", "rentabilite"] });
    void queryClient.invalidateQueries({ queryKey: rentabiliteKeys.classement });
  };
  return {
    enregistrer: useMutation({
      mutationFn: async ({ idTypeEngin, unite, tarif }: { idTypeEngin: number; unite: UniteTarif; tarif: number }) =>
        (await apiClient.put<TarifRefacturation>(`/api/tarifs-refacturation/${idTypeEngin}`, { unite, tarif })).data,
      onSuccess: rafraichir,
    }),
    supprimer: useMutation({
      mutationFn: async (idTypeEngin: number) => {
        await apiClient.delete(`/api/tarifs-refacturation/${idTypeEngin}`);
      },
      onSuccess: rafraichir,
    }),
  };
}

export function useProformaChantier(idChantier: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.post<{ idFactureProforma: number }>(`/api/chantiers/${idChantier}/proforma`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["factures-proforma"] }),
  });
}
