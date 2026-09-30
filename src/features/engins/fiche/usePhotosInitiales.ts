import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  NOMBRE_MAX_PHOTOS,
  TAILLE_MAX_PHOTO,
  TYPES_PHOTO_ACCEPTES,
  type PhotoInitiale,
} from "@/features/engins/fiche/photos-initiales";
import { toast } from "sonner";

/**
 * Photos choisies sur la fiche de création, avant que l'engin existe
 * (2026-09-24). Regroupe l'état et le sélecteur de fichiers pour que la
 * bannière (clic sur le cadre photo) et la bande de vignettes partagent
 * la même sélection. Rien n'est envoyé ici — voir televerserPhotosInitiales.
 */
export function usePhotosInitiales() {
  const [photos, setPhotos] = useState<PhotoInitiale[]>([]);
  const [idPrincipale, setIdPrincipale] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Libère les aperçus encore affichés quand on quitte la page.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.apercu)), []);

  const onFichiers = (e: ChangeEvent<HTMLInputElement>) => {
    const fichiers = Array.from(e.target.files ?? []);
    e.target.value = "";
    const acceptes: PhotoInitiale[] = [];
    for (const fichier of fichiers) {
      if (!TYPES_PHOTO_ACCEPTES.includes(fichier.type)) {
        toast.error(`« ${fichier.name} » : format non accepté (JPEG, PNG ou WebP)`);
      } else if (fichier.size > TAILLE_MAX_PHOTO) {
        toast.error(`« ${fichier.name} » dépasse 5 Mo`);
      } else if (photos.length + acceptes.length >= NOMBRE_MAX_PHOTOS) {
        toast.error(`${NOMBRE_MAX_PHOTOS} photos au maximum sur la fiche de création`);
        break;
      } else {
        // Pas de crypto.randomUUID : indisponible si l'appli est servie en HTTP simple sur le réseau local.
        acceptes.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, fichier, apercu: URL.createObjectURL(fichier) });
      }
    }
    if (acceptes.length === 0) return;
    setPhotos((actuelles) => [...actuelles, ...acceptes]);
    setIdPrincipale((actuelle) => actuelle ?? acceptes[0].id);
  };

  const retirer = (photo: PhotoInitiale) => {
    URL.revokeObjectURL(photo.apercu);
    const restantes = photos.filter((p) => p.id !== photo.id);
    setPhotos(restantes);
    if (idPrincipale === photo.id) setIdPrincipale(restantes[0]?.id ?? null);
  };

  return {
    photos,
    idPrincipale,
    principale: photos.find((p) => p.id === idPrincipale),
    definirPrincipale: setIdPrincipale,
    retirer,
    ouvrirSelecteur: () => inputRef.current?.click(),
    /** À répandre sur un <input> caché rendu une seule fois par la page. */
    propsChamp: {
      ref: inputRef,
      type: "file" as const,
      multiple: true,
      accept: TYPES_PHOTO_ACCEPTES.join(","),
      className: "hidden",
      onChange: onFichiers,
    },
  };
}

export type PhotosInitiales = ReturnType<typeof usePhotosInitiales>;
