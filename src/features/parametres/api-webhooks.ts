import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LivraisonWebhook, Webhook } from "@/types/webhook";

/** Webhooks des alertes critiques (2026-09-29), capacité ADMINISTRER. */
export const webhooksKeys = {
  liste: ["webhooks"] as const,
  livraisons: (id: number) => ["webhooks", "livraisons", id] as const,
};

export interface EnregistrerWebhook {
  nom: string;
  url: string;
  actif: boolean;
}

export function useWebhooks() {
  return useQuery({ queryKey: webhooksKeys.liste, queryFn: async () => (await apiClient.get<Webhook[]>("/api/webhooks")).data });
}

export function useLivraisonsWebhook(id: number | null) {
  return useQuery({
    queryKey: webhooksKeys.livraisons(id ?? 0),
    queryFn: async () => (await apiClient.get<LivraisonWebhook[]>(`/api/webhooks/${id}/livraisons`)).data,
    enabled: id !== null,
  });
}

function useMutationWebhook<V>(fn: (v: V) => Promise<Webhook | LivraisonWebhook | void>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: fn, onSettled: () => queryClient.invalidateQueries({ queryKey: webhooksKeys.liste }) });
}

export function useCreerWebhook() {
  return useMutationWebhook(async (r: EnregistrerWebhook) => (await apiClient.post<Webhook>("/api/webhooks", r)).data);
}

export function useModifierWebhook() {
  return useMutationWebhook(async ({ id, ...r }: EnregistrerWebhook & { id: number }) => (await apiClient.put<Webhook>(`/api/webhooks/${id}`, r)).data);
}

export function useRenouvelerSecret() {
  return useMutationWebhook(async (id: number) => (await apiClient.post<Webhook>(`/api/webhooks/${id}/secret`)).data);
}

export function useSupprimerWebhook() {
  return useMutationWebhook(async (id: number) => {
    await apiClient.delete(`/api/webhooks/${id}`);
  });
}

export function useTesterWebhook() {
  return useMutationWebhook(async (id: number) => (await apiClient.post<LivraisonWebhook>(`/api/webhooks/${id}/test`)).data);
}
