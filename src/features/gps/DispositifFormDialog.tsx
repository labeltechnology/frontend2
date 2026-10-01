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
import { useEngins } from "@/features/engins/api";
import { useInstallerDispositif } from "@/features/gps/api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

const schema = z.object({
  numeroSerie: z.string().min(1, "Requis"),
  idEngin: z.string().min(1, "Requis"),
  dateInstallation: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface DispositifFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DispositifFormDialog({ open, onOpenChange }: DispositifFormDialogProps) {
  const { data: engins } = useEngins();
  const installer = useInstallerDispositif();

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
      await installer.mutateAsync({
        numeroSerie: values.numeroSerie,
        idEngin: Number(values.idEngin),
        dateInstallation: values.dateInstallation || undefined,
      });
      toast.success("Dispositif GPS installé");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Installation impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Installer un dispositif GPS</DialogTitle>
          <DialogDescription>Associez un boîtier GPS à un véhicule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numeroSerie">Numéro de série</Label>
            <Input id="numeroSerie" {...register("numeroSerie")} />
            {errors.numeroSerie && <p className="text-sm text-destructive">{errors.numeroSerie.message}</p>}
          </div>
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
            <Label htmlFor="dateInstallation">Date d'installation</Label>
            <Input id="dateInstallation" type="date" {...register("dateInstallation")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Installer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
