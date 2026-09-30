import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GaleriePhotosEngin } from "@/features/engins/GaleriePhotosEngin";
import type { Engin } from "@/types/engin";
import { libelleVehicule } from "@/lib/vehicule";

interface EnginPhotosDialogProps {
  engin: Engin | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Galerie de photos réelles d'un engin (upload de vrais fichiers image —
 * choix confirmé avec l'utilisateur), ouverte depuis la liste des engins.
 * Depuis le 2026-09-24, le contenu vit dans {@link GaleriePhotosEngin},
 * partagé avec l'onglet « Photos » de la fiche véhicule.
 */
export function EnginPhotosDialog({ engin, onOpenChange }: EnginPhotosDialogProps) {
  return (
    <Dialog open={!!engin} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Photos du véhicule</DialogTitle>
          <DialogDescription>
            {libelleVehicule(engin)}
          </DialogDescription>
        </DialogHeader>
        <GaleriePhotosEngin idEngin={engin?.idEngin} />
      </DialogContent>
    </Dialog>
  );
}
