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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConducteurs } from "@/features/conducteurs/api";
import { useEngins } from "@/features/engins/api";
import { useCreerAffectation } from "@/features/affectations/api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

const schema = z.object({
  idEngin: z.string().min(1, "Requis"),
  idConducteur: z.string().min(1, "Requis"),
});

type FormValues = z.infer<typeof schema>;

interface AffectationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Règle 3.1 : une affectation lie durablement un conducteur à un engin (hors mission ponctuelle). */
export function AffectationFormDialog({ open, onOpenChange }: AffectationFormDialogProps) {
  const { data: engins } = useEngins();
  const { data: conducteurs } = useConducteurs();
  const creerAffectation = useCreerAffectation();

  const {
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
      await creerAffectation.mutateAsync({
        idEngin: Number(values.idEngin),
        idConducteur: Number(values.idConducteur),
      });
      toast.success("Affectation créée");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer l'affectation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle affectation</DialogTitle>
          <DialogDescription>Affectez durablement un conducteur à un véhicule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Véhicule</Label>
            <Select value={watch("idEngin")} onValueChange={(v) => setValue("idEngin", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {engins?.map((e) => (
                  <SelectItem key={e.idEngin} value={String(e.idEngin)}>
                    {libelleVehicule(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idEngin && <p className="text-sm text-destructive">{errors.idEngin.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Conducteur</Label>
            <Select value={watch("idConducteur")} onValueChange={(v) => setValue("idConducteur", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {conducteurs?.map((c) => (
                  <SelectItem key={c.idConducteur} value={String(c.idConducteur)}>
                    {c.nom} {c.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idConducteur && <p className="text-sm text-destructive">{errors.idConducteur.message}</p>}
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
