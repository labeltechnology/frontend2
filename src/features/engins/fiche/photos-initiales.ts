import { ajouterPhoto } from "@/features/engins/photos-api";

/** Photo choisie sur la fiche de création, avant que l'engin existe (pas encore envoyée). */
export interface PhotoInitiale {
  id: string;
  fichier: File;
  /** URL locale d'aperçu (URL.createObjectURL) — à révoquer quand la photo est retirée. */
  apercu: string;
}

/** Mêmes limites que le backend (FileStorageService) : on refuse tôt plutôt qu'après la création de l'engin. */
export const TYPES_PHOTO_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];
export const TAILLE_MAX_PHOTO = 5 * 1024 * 1024;
export const NOMBRE_MAX_PHOTOS = 10;

/**
 * Envoie les photos juste après la création de l'engin (son identifiant
 * n'existe qu'à ce moment-là) : la principale d'abord, puis les autres, une
 * par une. Renvoie le nombre d'échecs — l'engin, lui, est déjà créé ; les
 * photos manquantes s'ajoutent ensuite depuis l'onglet « Photos » de la fiche.
 */
export async function televerserPhotosInitiales(
  idEngin: number,
  photos: PhotoInitiale[],
  idPrincipale: string | null,
): Promise<number> {
  const ordre = [...photos].sort((a, b) => Number(b.id === idPrincipale) - Number(a.id === idPrincipale));
  let echecs = 0;
  for (const [index, photo] of ordre.entries()) {
    try {
      // Sans choix explicite, la première photo devient la principale.
      const principale = idPrincipale ? photo.id === idPrincipale : index === 0;
      await ajouterPhoto(idEngin, photo.fichier, principale);
    } catch {
      echecs++;
    }
  }
  return echecs;
}
