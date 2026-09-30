import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { EnregistrerJournalRequest, JournalChantier, PhotoJournal } from "@/types/chantier";

/** Journal de chantier (2026-09-29) — JournalChantierController côté serveur. */
export const journalChantierKeys = {
  liste: (idChantier: number) => ["chantiers", "journal", idChantier] as const,
};

export function useJournalChantier(idChantier: number | undefined, actif = true) {
  return useQuery({
    queryKey: journalChantierKeys.liste(idChantier ?? 0),
    queryFn: async () => (await apiClient.get<JournalChantier[]>(`/api/chantiers/${idChantier}/journal`)).data,
    enabled: actif && idChantier !== undefined,
  });
}

function useRafraichir(idChantier: number) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: journalChantierKeys.liste(idChantier) });
    // Les heures du journal entrent dans les coûts du chantier.
    void queryClient.invalidateQueries({ queryKey: ["chantiers", "couts", idChantier] });
  };
}

export function useEnregistrerJournee(idChantier: number) {
  const rafraichir = useRafraichir(idChantier);
  return useMutation({
    mutationFn: async ({ idJournal, requete }: { idJournal?: number; requete: EnregistrerJournalRequest }) =>
      idJournal
        ? (await apiClient.put<JournalChantier>(`/api/journal-chantier/${idJournal}`, requete)).data
        : (await apiClient.post<JournalChantier>(`/api/chantiers/${idChantier}/journal`, requete)).data,
    onSuccess: rafraichir,
  });
}

export function useSupprimerJournee(idChantier: number) {
  const rafraichir = useRafraichir(idChantier);
  return useMutation({
    mutationFn: async (idJournal: number) => {
      await apiClient.delete(`/api/journal-chantier/${idJournal}`);
    },
    onSuccess: rafraichir,
  });
}

export function useAjouterPhotoJournee(idChantier: number) {
  const rafraichir = useRafraichir(idChantier);
  return useMutation({
    mutationFn: async ({ idJournal, fichier, legende }: { idJournal: number; fichier: File; legende?: string }) => {
      const donnees = new FormData();
      donnees.append("fichier", fichier);
      const { data } = await apiClient.post<PhotoJournal>(`/api/journal-chantier/${idJournal}/photos`, donnees, {
        params: legende ? { legende } : undefined,
        headers: { "Content-Type": undefined },
      });
      return data;
    },
    onSuccess: rafraichir,
  });
}

export function useRetirerPhotoJournee(idChantier: number) {
  const rafraichir = useRafraichir(idChantier);
  return useMutation({
    mutationFn: async (idPhoto: number) => {
      await apiClient.delete(`/api/journal-chantier/photos/${idPhoto}`);
    },
    onSuccess: rafraichir,
  });
}
