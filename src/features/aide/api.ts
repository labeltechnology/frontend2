import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/** Retours sur l'aide en ligne (2026-09-28, étape 7 « mesurer ») — voir AideController côté serveur. */

export interface MonVoteAide {
  idPage: string;
  utile: boolean | null;
}

export interface StatistiquesAide {
  pages: { idPage: string; oui: number; non: number; commentaires: { texte: string; utile: boolean; date: string }[] }[];
  recherchesSansResultat: { terme: string; nombre: number; derniereDate: string }[];
}

export const aideKeys = {
  monVote: (idPage: string) => ["aide", "vote", idPage] as const,
  statistiques: ["aide", "statistiques"] as const,
};

export function useMonVoteAide(idPage: string) {
  return useQuery({
    queryKey: aideKeys.monVote(idPage),
    queryFn: async () => (await apiClient.get<MonVoteAide>(`/api/aide/votes/${encodeURIComponent(idPage)}/moi`)).data,
    staleTime: Infinity,
  });
}

export function useVoterAide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vote: { idPage: string; utile: boolean; commentaire?: string }) =>
      (await apiClient.post<MonVoteAide>("/api/aide/votes", vote)).data,
    onSuccess: (vote) => {
      queryClient.setQueryData(aideKeys.monVote(vote.idPage), vote);
      queryClient.invalidateQueries({ queryKey: aideKeys.statistiques });
    },
  });
}

/** Signale une recherche sans résultat (silencieux : une erreur ici ne gêne pas l'utilisateur). */
export async function signalerRechercheVide(terme: string): Promise<void> {
  try {
    await apiClient.post("/api/aide/recherches-sans-resultat", { terme });
  } catch {
    // mesure facultative : on ignore
  }
}

export function useStatistiquesAide(actif: boolean) {
  return useQuery({
    queryKey: aideKeys.statistiques,
    queryFn: async () => (await apiClient.get<StatistiquesAide>("/api/aide/statistiques")).data,
    enabled: actif,
  });
}
