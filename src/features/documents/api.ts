import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CreerDocumentRequest, Document, RemplacerDocumentRequest } from "@/types/document";

export const documentsKeys = {
  liste: ["documents"] as const,
};

async function listerDocuments(): Promise<Document[]> {
  const { data } = await apiClient.get<Document[]>("/api/documents");
  return data;
}

async function creerDocument(requete: CreerDocumentRequest): Promise<Document> {
  const { data } = await apiClient.post<Document>("/api/documents", requete);
  return data;
}

async function remplacerDocument(id: number, requete: RemplacerDocumentRequest): Promise<Document> {
  const { data } = await apiClient.post<Document>(`/api/documents/${id}/remplacer`, requete);
  return data;
}

export function useDocuments() {
  return useQuery({ queryKey: documentsKeys.liste, queryFn: listerDocuments });
}

export function useCreerDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: creerDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKeys.liste }),
  });
}

export function useRemplacerDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requete }: { id: number; requete: RemplacerDocumentRequest }) => remplacerDocument(id, requete),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsKeys.liste }),
  });
}
