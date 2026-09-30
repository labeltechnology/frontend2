import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMettreAJourKilometrage } from "@/features/engins/api";
import type { Engin } from "@/types/engin";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface KilometrageDialogProps {
  engin: Engin | null;
  onOpenChange: (open: boolean) => void;
}

export function KilometrageDialog({ engin, onOpenChange }: KilometrageDialogProps) {
  const [valeur, setValeur] = useState("");
  const mutation = useMettreAJourKilometrage();

  const onSubmit = async () => {
    if (!engin) return;
    const nombre = Number(valeur);
    if (!Number.isFinite(nombre) || nombre < 0) {
      toast.error("Kilométrage invalide");
      return;
    }
    try {
      await mutation.mutateAsync({ id: engin.idEngin, nouveauKm: nombre });
      toast.success("Kilométrage mis à jour");
      setValeur("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Mise à jour impossible");
    }
  };

  return (
    <Dialog open={!!engin} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre à jour le kilométrage</DialogTitle>
          <DialogDescription>{libelleVehicule(engin)} — kilométrage actuel : {engin?.kilometrage ?? "—"} km</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="nouveauKm">Nouveau kilométrage</Label>
          <Input
            id="nouveauKm"
            type="number"
            min={0}
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
