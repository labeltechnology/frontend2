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
import { useCreerZone } from "@/features/zones/api";
import { ApiError } from "@/lib/api-client";
import type { ModeDefinitionZone, TypeZone } from "@/types/zone";
import { toast } from "sonner";

const schema = z
  .object({
    nom: z.string().min(1, "Requis"),
    type: z.enum(["AUTORISEE", "INTERDITE"]),
    modeDefinition: z.enum(["CERCLE", "POLYGONE"]),
    centreLatitude: z.string().optional(),
    centreLongitude: z.string().optional(),
    rayonMetres: z.string().optional(),
    polygoneGeoJson: z.string().optional(),
  })
  .refine((v) => v.modeDefinition !== "CERCLE" || (v.centreLatitude && v.centreLongitude && v.rayonMetres), {
    message: "La latitude, la longitude et le rayon sont requis pour une zone circulaire",
    path: ["centreLatitude"],
  })
  .refine((v) => v.modeDefinition !== "POLYGONE" || !!v.polygoneGeoJson, {
    message: "Le GeoJSON du polygone est requis pour une zone en mode polygone",
    path: ["polygoneGeoJson"],
  });

type FormValues = z.infer<typeof schema>;

interface ZoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Règle 7.x : une zone géographique est définie soit par un cercle (centre +
 * rayon), soit par un polygone (GeoJSON), jamais les deux — voir
 * ZoneGeographiqueService côté backend qui valide déjà cette contrainte ;
 * cette validation côté formulaire n'est qu'un confort d'UX.
 */
export function ZoneFormDialog({ open, onOpenChange }: ZoneFormDialogProps) {
  const creerZone = useCreerZone();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "AUTORISEE", modeDefinition: "CERCLE" },
  });

  const modeDefinition = watch("modeDefinition");

  useEffect(() => {
    if (!open) reset({ type: "AUTORISEE", modeDefinition: "CERCLE" });
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await creerZone.mutateAsync({
        nom: values.nom,
        type: values.type,
        modeDefinition: values.modeDefinition,
        centreLatitude: values.centreLatitude ? Number(values.centreLatitude) : undefined,
        centreLongitude: values.centreLongitude ? Number(values.centreLongitude) : undefined,
        rayonMetres: values.rayonMetres ? Number(values.rayonMetres) : undefined,
        polygoneGeoJson: values.polygoneGeoJson || undefined,
      });
      toast.success("Zone créée");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer la zone");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle zone géographique</DialogTitle>
          <DialogDescription>Définissez une zone autorisée ou interdite pour le suivi GPS.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" {...register("nom")} />
            {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v as TypeZone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTORISEE">Autorisée</SelectItem>
                  <SelectItem value="INTERDITE">Interdite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode de définition</Label>
              <Select
                value={watch("modeDefinition")}
                onValueChange={(v) => setValue("modeDefinition", v as ModeDefinitionZone)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CERCLE">Cercle</SelectItem>
                  <SelectItem value="POLYGONE">Polygone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {modeDefinition === "CERCLE" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="centreLatitude">Latitude</Label>
                <Input id="centreLatitude" type="number" step="any" {...register("centreLatitude")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="centreLongitude">Longitude</Label>
                <Input id="centreLongitude" type="number" step="any" {...register("centreLongitude")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rayonMetres">Rayon (m)</Label>
                <Input id="rayonMetres" type="number" step="any" {...register("rayonMetres")} />
              </div>
              {errors.centreLatitude && (
                <p className="col-span-3 text-sm text-destructive">{errors.centreLatitude.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="polygoneGeoJson">Polygone (GeoJSON)</Label>
              <Textarea
                id="polygoneGeoJson"
                rows={4}
                placeholder='{"type":"Polygon","coordinates":[[[...]]]}'
                {...register("polygoneGeoJson")}
              />
              {errors.polygoneGeoJson && (
                <p className="text-sm text-destructive">{errors.polygoneGeoJson.message}</p>
              )}
            </div>
          )}

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
