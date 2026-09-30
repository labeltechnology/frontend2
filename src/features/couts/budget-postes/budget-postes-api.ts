import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { BudgetsPostes, EnregistrerBudgetPosteRequest } from "@/types/pilotage";

/**
 * Budgets par poste (2026-09-30) : maintenance, pneus, assurance et taxes,
 * détention, autres. Le carburant garde sa propre saisie (budget par type).
 * Rangés sous « couts » : toute modification des coûts les relit.
 */
export const budgetPostesKeys = {
  annee: (annee: number) => ["couts", "budget-postes", annee] as const,
};

export function useBudgetsPostes(annee: number, actif: boolean) {
  return useQuery({
    queryKey: budgetPostesKeys.annee(annee),
    queryFn: async () => (await apiClient.get<BudgetsPostes>("/api/couts/budget-postes", { params: { annee } })).data,
    enabled: actif,
  });
}

/** Après écriture : coûts (dont ces budgets) et tableau de bord de direction. */
function useRelire() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["couts"] }),
      queryClient.invalidateQueries({ queryKey: ["pilotage"] }),
    ]);
}

export function useEnregistrerBudgetPoste() {
  const relire = useRelire();
  return useMutation({
    mutationFn: async (requete: EnregistrerBudgetPosteRequest) => {
      await apiClient.put("/api/couts/budget-postes", requete);
    },
    onSuccess: relire,
  });
}

export function useSupprimerBudgetPoste() {
  const relire = useRelire();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/couts/budget-postes/${id}`);
    },
    onSuccess: relire,
  });
}
