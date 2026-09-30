import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AuthenticatedImageProps {
  /** URL applicative relative (ex. EnginPhoto.url) — nécessite le token d'authentification, donc pas de simple <img src>. */
  url: string;
  alt: string;
  className?: string;
}

/**
 * Le endpoint qui sert les octets d'une photo d'engin exige un utilisateur
 * authentifié (voir EnginPhotoController.fichier côté backend) : un <img
 * src="..."> classique n'envoie pas l'en-tête Authorization, donc l'image
 * échouerait silencieusement. On récupère plutôt le fichier via apiClient
 * (qui ajoute le token, voir api-client.ts) et on l'affiche depuis un
 * object URL local.
 */
export function AuthenticatedImage({ url, alt, className }: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [enErreur, setEnErreur] = useState(false);

  useEffect(() => {
    let urlCourante: string | null = null;
    let annule = false;
    setEnErreur(false);
    setObjectUrl(null);

    apiClient
      .get(url, { responseType: "blob" })
      .then((reponse) => {
        if (annule) return;
        urlCourante = URL.createObjectURL(reponse.data);
        setObjectUrl(urlCourante);
      })
      .catch(() => {
        if (!annule) setEnErreur(true);
      });

    return () => {
      annule = true;
      if (urlCourante) URL.revokeObjectURL(urlCourante);
    };
  }, [url]);

  if (enErreur) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-xs text-muted-foreground", className)}>
        Image indisponible
      </div>
    );
  }

  if (!objectUrl) {
    return <div className={cn("animate-pulse bg-muted", className)} />;
  }

  return <img src={objectUrl} alt={alt} className={cn("object-cover", className)} />;
}
