import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { useCreerTravailMaintenance, useModifierTravailMaintenance } from "@/features/maintenance/travaux-api";
import { LIBELLES_PORTEE } from "@/features/referentiels-fiche/libelles";
import { ApiError } from "@/lib/api-client";
import type { PorteeCategorie } from "@/types/equipement-bord";
import type { TypeMaintenance } from "@/types/maintenance";
import type { TravailMaintenance } from "@/types/travail-maintenance";

const LIBELLES_TYPE: Record<TypeMaintenance, string> = {
  PREVENTIVE: "Préventive (entretien, usure)",
  CORRECTIVE: "Corrective (réparation, panne)",
};

const schema = z.object({
  libelle: z.string().trim().min(1, "Requis").max(150, "150 caractères maximum"),
  typeMaintenance: z.enum(["PREVENTIVE", "CORRECTIVE"]),
  portee: z.enum(["TOUS", "VEHICULE_ROUTIER", "ENGIN_CHANTIER"]),
  ordre: z.coerce.number().int("Nombre entier attendu").min(0, "Positif ou nul"),
});

type FormValues = z.infer<typeof schema>;

interface TravailMaintenanceFormDialogProps {
  /** Présent = édition ; null = création (même patron qu'ElementBordFormDialog). */
  travail: TravailMaintenance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ajout / modification d'un travail du référentiel « Travaux de maintenance » (V45, 2026-09-25). */
export function TravailMaintenanceFormDialog({ travail, open, onOpenChange }: TravailMaintenanceFormDialogProps) {
  const creer = useCreerTravailMaintenance();
  const modifier = useModifierTravailMaintenance();
  const enEdition = travail != null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    reset(
      travail
        ? { libelle: travail.libelle, typeMaintenance: travail.typeMaintenance, portee: travail.portee, ordre: travail.ordre }
        : { libelle: "", typeMaintenance: "PREVENTIVE", portee: "TOUS", ordre: 0 },
    );
  }, [open, travail, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = { ...values, libelle: values.libelle.trim() };
    try {
      if (enEdition) {
        await modifier.mutateAsync({ id: travail.idTravailMaintenance, requete });
        toast.success("Travail modifié");
      } else {
        await creer.mutateAsync(requete);
        toast.success("Travail ajouté");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{enEdition ? "Modifier le travail" : "Nouveau travail de maintenance"}</DialogTitle>
          <DialogDescription>Proposé dans la boîte « Faire la maintenance » du rapport véhicule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle-travail">Libellé</Label>
            <Input id="libelle-travail" placeholder="Ex. : Changement des plaquettes de frein" {...register("libelle")} />
            {errors.libelle && <p className="text-sm text-destructive">{errors.libelle.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type-travail">Type proposé</Label>
              <Controller
                control={control}
                name="typeMaintenance"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type-travail">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LIBELLES_TYPE) as TypeMaintenance[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {LIBELLES_TYPE[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portee-travail">S'applique à</Label>
              <Controller
                control={control}
                name="portee"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="portee-travail">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LIBELLES_PORTEE) as PorteeCategorie[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {LIBELLES_PORTEE[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ordre-travail">Ordre d'affichage</Label>
            <Input id="ordre-travail" inputMode="numeric" {...register("ordre")} />
            {errors.ordre && <p className="text-sm text-destructive">{errors.ordre.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {enEdition ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
