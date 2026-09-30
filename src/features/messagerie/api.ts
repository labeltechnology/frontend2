import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Contact, Conversation, MessageConversation, TypeObjetFil } from "@/types/messagerie";

/** API de la messagerie interne (2026-09-28) — voir MessagerieController côté serveur. */
export const clesMessagerie = {
  tout: ["messagerie"] as const,
  conversations: ["messagerie", "conversations"] as const,
  nonLus: ["messagerie", "non-lus"] as const,
  messages: (idConversation: number) => ["messagerie", "messages", idConversation] as const,
  contacts: ["messagerie", "contacts"] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: clesMessagerie.conversations,
    queryFn: async () => (await apiClient.get<Conversation[]>("/api/messagerie/conversations")).data,
  });
}

/**
 * Badge de la barre de navigation. Le temps réel l'actualise dès qu'un
 * message arrive ; la relecture toutes les 2 minutes n'est qu'un filet de
 * sécurité si la connexion temps réel est coupée.
 */
export function useNonLus(actif: boolean) {
  return useQuery({
    queryKey: clesMessagerie.nonLus,
    queryFn: async () => (await apiClient.get<{ total: number }>("/api/messagerie/non-lus")).data.total,
    enabled: actif,
    refetchInterval: 120_000,
  });
}

/** Les 50 messages les plus récents (ordre chronologique). */
export function useMessages(idConversation: number | null) {
  return useQuery({
    queryKey: clesMessagerie.messages(idConversation ?? 0),
    queryFn: async () =>
      (await apiClient.get<MessageConversation[]>(`/api/messagerie/conversations/${idConversation}/messages`)).data,
    enabled: idConversation !== null,
  });
}

/** Page précédente : messages plus anciens que {@code avant}. */
export async function chargerMessagesAvant(idConversation: number, avant: number): Promise<MessageConversation[]> {
  const { data } = await apiClient.get<MessageConversation[]>(`/api/messagerie/conversations/${idConversation}/messages`, {
    params: { avant },
  });
  return data;
}

export function useContacts(actif: boolean) {
  return useQuery({
    queryKey: clesMessagerie.contacts,
    queryFn: async () => (await apiClient.get<Contact[]>("/api/messagerie/contacts")).data,
    enabled: actif,
  });
}

export function useEnvoyerMessage(idConversation: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contenu, fichiers }: { contenu: string; fichiers: File[] }) => {
      const donnees = new FormData();
      donnees.append("contenu", contenu);
      for (const f of fichiers) donnees.append("fichiers", f);
      const { data } = await apiClient.post<MessageConversation>(
        `/api/messagerie/conversations/${idConversation}/messages`,
        donnees,
        // Laisser le navigateur fixer multipart/form-data et sa frontière.
        { headers: { "Content-Type": undefined } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clesMessagerie.messages(idConversation) });
      queryClient.invalidateQueries({ queryKey: clesMessagerie.conversations });
    },
  });
}

export function useMarquerLu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idConversation: number) => {
      await apiClient.post(`/api/messagerie/conversations/${idConversation}/lu`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clesMessagerie.conversations });
      queryClient.invalidateQueries({ queryKey: clesMessagerie.nonLus });
    },
  });
}

export function useOuvrirPrivee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idUtilisateur: number) =>
      (await apiClient.post<Conversation>("/api/messagerie/conversations/privee", { idUtilisateur })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clesMessagerie.conversations }),
  });
}

export function useOuvrirFil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, idObjet }: { type: TypeObjetFil; idObjet: number }) =>
      (await apiClient.post<Conversation>("/api/messagerie/conversations/fil", { type, idObjet })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clesMessagerie.conversations }),
  });
}

export async function demanderTicketTempsReel(): Promise<string> {
  const { data } = await apiClient.post<{ ticket: string }>("/api/messagerie/ticket-temps-reel");
  return data.ticket;
}

/** Télécharge une pièce jointe (appel authentifié) puis la propose à l'enregistrement. */
export async function telechargerPieceJointe(idPieceJointe: number, nom: string): Promise<void> {
  const { data } = await apiClient.get<Blob>(`/api/messagerie/pieces-jointes/${idPieceJointe}`, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function urlPieceJointe(idPieceJointe: number): string {
  return `/api/messagerie/pieces-jointes/${idPieceJointe}`;
}
