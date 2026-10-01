import { useRef, useState, type ChangeEvent } from "react";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import {
  useAjouterEnginPhoto,
  useDefinirPhotoPrincipale,
  useEnginPhotos,
  useSupprimerEnginPhoto,
} from "@/features/engins/photos-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * Galerie de photos réelles d'un engin existant : ajout, photo principale,
 * suppression. Extraite le 2026-09-24 d'EnginPhotosDialog pour être
 * réutilisée telle quelle dans l'onglet « Photos » de la fiche véhicule —
 * le dialogue de la liste des engins l'affiche toujours, sans changement de
 * comportement.
 */
export function GaleriePhotosEngin({ idEngin }: { idEngin: number | undefined }) {
  const { data: photos, isLoading } = useEnginPhotos(idEngin);
  const ajouter = useAjouterEnginPhoto(idEngin);
  const definirPrincipale = useDefinirPhotoPrincipale(idEngin);
  const supprimer = useSupprimerEnginPhoto(idEngin);
  const inputRef = useRef<HTMLInputElement>(null);
  const [enTransfert, setEnTransfert] = useState(false);

  const onChoisirFichier = () => inputRef.current?.click();

  const onFichierSelectionne = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    setEnTransfert(true);
    try {
      // Première photo de le véhicule : principale d'office, sinon la fiche resterait sans photo principale.
      await ajouter.mutateAsync({ fichier, principale: !photos || photos.length === 0 });
      toast.success("Photo ajoutée");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi de la photo impossible");
    } finally {
      setEnTransfert(false);
    }
  };

  const onDefinirPrincipale = async (idPhoto: number) => {
    try {
      await definirPrincipale.mutateAsync(idPhoto);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action impossible");
    }
  };

  const onSupprimer = async (idPhoto: number) => {
    try {
      await supprimer.mutateAsync(idPhoto);
      toast.success("Photo supprimée");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFichierSelectionne}
      />
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Formats acceptés : JPEG, PNG, WebP (5 Mo maximum).</p>
        <Button onClick={onChoisirFichier} disabled={enTransfert || !idEngin}>
          {enTransfert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Ajouter une photo
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement des photos…</p>}
      {!isLoading && (!photos || photos.length === 0) && (
        <p className="text-sm text-muted-foreground">Aucune photo pour ce véhicule.</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos?.map((photo) => (
          <div key={photo.idEnginPhoto} className="space-y-1">
            <div className="relative overflow-hidden rounded-md border">
              <AuthenticatedImage url={photo.url} alt={photo.nomFichierOriginal ?? "Photo du véhicule"} className="h-28 w-full" />
              {photo.estPrincipale && (
                <Badge variant="success" className="absolute left-1 top-1">
                  Principale
                </Badge>
              )}
            </div>
            <div className="flex justify-between gap-1">
              <Button
                variant="outline"
                size="icon"
                title="Définir comme photo principale"
                disabled={photo.estPrincipale || definirPrincipale.isPending}
                onClick={() => onDefinirPrincipale(photo.idEnginPhoto)}
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                title="Supprimer la photo"
                disabled={supprimer.isPending}
                onClick={() => onSupprimer(photo.idEnginPhoto)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
