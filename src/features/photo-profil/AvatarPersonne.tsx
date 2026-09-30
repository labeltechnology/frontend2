import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AvatarInitiales } from "@/components/ui/avatar-initiales";
import { clesProfil } from "@/features/photo-profil/api";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Photo protégée (2026-09-29) : l'URL exige le jeton d'accès, donc pas de
 * simple <img src>. Les octets sont chargés une fois par URL (l'URL change
 * avec la photo : cache sans fin) et partagés par tous les avatars.
 */
export function usePhotoProtegee(url: string | null | undefined): string | null {
  const { data } = useQuery({
    queryKey: clesProfil.photo(url),
    queryFn: async () => (await apiClient.get<Blob>(url as string, { responseType: "blob" })).data,
    enabled: !!url,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
  const [objet, setObjet] = useState<string | null>(null);
  useEffect(() => {
    if (!data || !url) {
      setObjet(null);
      return;
    }
    const lien = URL.createObjectURL(data);
    setObjet(lien);
    return () => URL.revokeObjectURL(lien);
  }, [data, url]);
  return objet;
}

/**
 * Avatar d'une personne : sa photo si elle en a une, sinon ses initiales
 * (pendant le chargement aussi). Même taille par défaut que AvatarInitiales.
 */
export function AvatarPersonne({
  urlPhoto,
  initiales,
  nom,
  className,
}: {
  urlPhoto: string | null | undefined;
  initiales: string;
  /** Texte alternatif : « Photo de … ». */
  nom?: string | null;
  className?: string;
}) {
  const source = usePhotoProtegee(urlPhoto);
  if (!source) return <AvatarInitiales initiales={initiales} className={className} />;
  return (
    <img
      src={source}
      alt={nom ? `Photo de ${nom}` : "Photo de profil"}
      className={cn("inline-block h-8 w-8 shrink-0 rounded-full object-cover", className)}
    />
  );
}
