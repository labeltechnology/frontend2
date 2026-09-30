import { ImagePlus, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PhotosInitiales } from "@/features/engins/fiche/usePhotosInitiales";

/**
 * Bande de vignettes des photos choisies sur la fiche de création
 * (2026-09-24). Purement affichage : la sélection vit dans
 * usePhotosInitiales, partagée avec la bannière (qui montre la principale en
 * grand). L'étoile désigne la photo principale.
 */
export function SelectionPhotosInitiales({ selection }: { selection: PhotosInitiales }) {
  const { photos, idPrincipale, definirPrincipale, retirer, ouvrirSelecteur } = selection;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          JPEG, PNG ou WebP, 5 Mo maximum par photo. L'étoile désigne la photo principale (affichée en haut de la fiche et
          sur la carte GPS).
        </p>
        <Button type="button" variant="outline" onClick={ouvrirSelecteur}>
          <ImagePlus className="h-4 w-4" />
          Ajouter des photos
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune photo choisie.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((photo) => {
            const principale = photo.id === idPrincipale;
            return (
              <div key={photo.id} className="space-y-1">
                <div className="relative overflow-hidden rounded-md border">
                  <img src={photo.apercu} alt={photo.fichier.name} className="h-28 w-full object-cover" />
                  {principale && (
                    <Badge variant="success" className="absolute left-1 top-1">
                      Principale
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Définir comme photo principale"
                    disabled={principale}
                    onClick={() => definirPrincipale(photo.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" title="Retirer la photo" onClick={() => retirer(photo)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
