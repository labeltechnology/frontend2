import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { MonProfil, PhotoProfilReponse } from "@/types/photo-profil";

/** API des photos de profil (2026-09-29) — voir PhotosProfilController côté serveur. */
export const clesProfil = {
  monProfil: ["mon-profil"] as const,
  photo: (url: string | null | undefined) => ["photo-profil", url ?? ""] as const,
};

export function useMonProfil() {
  return useQuery({
    queryKey: clesProfil.monProfil,
    queryFn: async () => (await apiClient.get<MonProfil>("/api/mon-compte/profil")).data,
    staleTime: 5 * 60 * 1000,
  });
}

async function envoyer(url: string, photo: Blob): Promise<PhotoProfilReponse> {
  const donnees = new FormData();
  donnees.append("fichier", photo, "photo.jpg");
  // Laisser le navigateur poser l'en-tête multipart avec sa frontière (voir engins/photos-api.ts).
  const { data } = await apiClient.put<PhotoProfilReponse>(url, donnees, { headers: { "Content-Type": undefined } });
  return data;
}

async function retirer(url: string): Promise<PhotoProfilReponse> {
  const { data } = await apiClient.delete<PhotoProfilReponse>(url);
  return data;
}

/** Une photo apparaît dans plusieurs listes : on les rafraîchit toutes. */
function rafraichir(queryClient: QueryClient) {
  for (const cle of [clesProfil.monProfil, ["conducteurs"], ["utilisateurs"], ["messagerie"]]) {
    queryClient.invalidateQueries({ queryKey: cle });
  }
}

export function useChangerMaPhoto() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (photo: Blob) => envoyer("/api/mon-compte/photo", photo), onSuccess: () => rafraichir(queryClient) });
}

export function useRetirerMaPhoto() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => retirer("/api/mon-compte/photo"), onSuccess: () => rafraichir(queryClient) });
}

export function useChangerPhotoConducteur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idConducteur, photo }: { idConducteur: number; photo: Blob }) => envoyer(`/api/conducteurs/${idConducteur}/photo`, photo),
    onSuccess: () => rafraichir(queryClient),
  });
}

export function useRetirerPhotoConducteur() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (idConducteur: number) => retirer(`/api/conducteurs/${idConducteur}/photo`), onSuccess: () => rafraichir(queryClient) });
}

export function useChangerPhotoCompte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idUtilisateur, photo }: { idUtilisateur: number; photo: Blob }) => envoyer(`/api/utilisateurs/${idUtilisateur}/photo`, photo),
    onSuccess: () => rafraichir(queryClient),
  });
}

export function useRetirerPhotoCompte() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (idUtilisateur: number) => retirer(`/api/utilisateurs/${idUtilisateur}/photo`), onSuccess: () => rafraichir(queryClient) });
}
