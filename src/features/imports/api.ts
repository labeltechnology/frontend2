import { useMutation } from "@tanstack/react-query";
import { cheminImport } from "@/features/imports/imports";
import { apiClient } from "@/lib/api-client";
import { declencherTelechargementBlob } from "@/lib/utils";
import type { ResultatImport, TypeImport } from "@/types/importation";

/** Import Excel / CSV (2026-09-29), capacité GERER_PARC. */
async function envoyer(url: string, fichier: File): Promise<ResultatImport> {
  const donnees = new FormData();
  donnees.append("fichier", fichier);
  // Laisser le navigateur poser le Content-Type multipart (avec sa frontière).
  const { data } = await apiClient.post<ResultatImport>(url, donnees, { headers: { "Content-Type": undefined } });
  return data;
}

export function useApercuImport() {
  return useMutation({
    mutationFn: ({ type, fichier }: { type: TypeImport; fichier: File }) => envoyer(`/api/imports/${cheminImport(type)}/apercu`, fichier),
  });
}

export function useImporter() {
  return useMutation({
    mutationFn: ({ type, fichier }: { type: TypeImport; fichier: File }) => envoyer(`/api/imports/${cheminImport(type)}`, fichier),
  });
}

export async function telechargerModele(type: TypeImport): Promise<void> {
  const chemin = cheminImport(type);
  const { data } = await apiClient.get<Blob>(`/api/imports/${chemin}/modele`, { responseType: "blob" });
  declencherTelechargementBlob(data, `modele-import-${chemin}.xlsx`);
}
