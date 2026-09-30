import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFournisseurs } from "@/features/fournisseurs/api";
import { useCreerPiece } from "@/features/maintenance/api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const AUCUN_FOURNISSEUR = "__aucun__";

const schema = z.object({
  reference: z.string().min(1, "Requis"),
  nom: z.string().min(1, "Requis"),
  prixUnitaire: z.coerce.number().min(0, "Doit être positif"),
  quantiteStock: z.coerce.number().int().min(0, "Doit être positif"),
  seuilAlerteStock: z.coerce.number().int().min(0, "Doit être positif"),
  idFournisseur: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PieceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PieceFormDialog({ open, onOpenChange }: PieceFormDialogProps) {
  const creerPiece = useCreerPiece();
  const { data: fournisseurs } = useFournisseurs();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await creerPiece.mutateAsync({
        ...values,
        idFournisseur:
          values.idFournisseur && values.idFournisseur !== AUCUN_FOURNISSEUR ? Number(values.idFournisseur) : undefined,
      });
      toast.success("Pièce créée");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer la pièce");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle pièce</DialogTitle>
          <DialogDescription>Ajoute une pièce de rechange au stock.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" {...register("reference")} />
              {errors.reference && <p className="text-sm text-destructive">{errors.reference.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" {...register("nom")} />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prixUnitaire">Prix unitaire</Label>
              <Input id="prixUnitaire" type="number" step="0.01" min={0} {...register("prixUnitaire")} />
              {errors.prixUnitaire && <p className="text-sm text-destructive">{errors.prixUnitaire.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantiteStock">Stock initial</Label>
              <Input id="quantiteStock" type="number" min={0} {...register("quantiteStock")} />
              {errors.quantiteStock && <p className="text-sm text-destructive">{errors.quantiteStock.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="seuilAlerteStock">Seuil d'alerte</Label>
              <Input id="seuilAlerteStock" type="number" min={0} {...register("seuilAlerteStock")} />
              {errors.seuilAlerteStock && (
                <p className="text-sm text-destructive">{errors.seuilAlerteStock.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fournisseur (optionnel)</Label>
            <Select
              value={watch("idFournisseur") ?? AUCUN_FOURNISSEUR}
              onValueChange={(v) => setValue("idFournisseur", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUCUN_FOURNISSEUR}>Aucun</SelectItem>
                {fournisseurs?.map((f) => (
                  <SelectItem key={f.idFournisseur} value={String(f.idFournisseur)}>
                    {f.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
