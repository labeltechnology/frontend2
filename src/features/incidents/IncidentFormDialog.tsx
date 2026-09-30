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
import { Textarea } from "@/components/ui/textarea";
import { useConducteurs } from "@/features/conducteurs/api";
import { useEngins } from "@/features/engins/api";
import { useDeclarerIncident } from "@/features/incidents/api";
import { ApiError } from "@/lib/api-client";
import type { PrioriteAlerte } from "@/types/alerte";
import type { TypeIncident } from "@/types/incident";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";
import { LienAide } from "@/features/aide/LienAide";

const TYPES: TypeIncident[] = ["ACCIDENT", "PANNE", "VOL", "AUTRE", "DEGATS"];
const GRAVITES: PrioriteAlerte[] = ["FAIBLE", "MOYENNE", "ELEVEE", "CRITIQUE"];

const schema = z.object({
  idEngin: z.string().min(1, "Requis"),
  idConducteur: z.string().optional(),
  type: z.enum(["ACCIDENT", "PANNE", "VOL", "AUTRE", "DEGATS"]),
  gravite: z.enum(["FAIBLE", "MOYENNE", "ELEVEE", "CRITIQUE"]),
  description: z.string().min(1, "Requis"),
  dateSurvenue: z.string().min(1, "Requis"),
});

type FormValues = z.infer<typeof schema>;

interface IncidentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Véhicule présélectionné à l'ouverture (2026-09-25 : bouton de la carte
   * « Incidents » du rapport véhicule) ; absent = choix libre, comme avant.
   */
  idEnginInitial?: number | null;
}

export function IncidentFormDialog({ open, onOpenChange, idEnginInitial = null }: IncidentFormDialogProps) {
  const { data: engins } = useEngins();
  const { data: conducteurs } = useConducteurs();
  const declarer = useDeclarerIncident();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "PANNE", gravite: "MOYENNE" },
  });

  useEffect(() => {
    if (!open) reset({ type: "PANNE", gravite: "MOYENNE" });
    else if (idEnginInitial != null) setValue("idEngin", String(idEnginInitial));
  }, [open, reset, setValue, idEnginInitial]);

  const onSubmit = async (values: FormValues) => {
    try {
      await declarer.mutateAsync({
        idEngin: Number(values.idEngin),
        idConducteur: values.idConducteur ? Number(values.idConducteur) : undefined,
        type: values.type,
        gravite: values.gravite,
        description: values.description,
        dateSurvenue: values.dateSurvenue,
      });
      toast.success("Incident déclaré");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de déclarer l'incident");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déclarer un incident</DialogTitle>
          <DialogDescription>Accident, panne, vol ou autre événement affectant un véhicule.</DialogDescription>
          <LienAide idPage="guide-declarer-incident" libelle="Comment faire ?" />
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Conducteur (optionnel)</Label>
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
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v as TypeIncident)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gravité</Label>
              <Select value={watch("gravite")} onValueChange={(v) => setValue("gravite", v as PrioriteAlerte)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRAVITES.map((gravite) => (
                    <SelectItem key={gravite} value={gravite}>
                      {gravite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateSurvenue">Date de survenue</Label>
            <Input id="dateSurvenue" type="datetime-local" {...register("dateSurvenue")} />
            {errors.dateSurvenue && <p className="text-sm text-destructive">{errors.dateSurvenue.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Déclarer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
