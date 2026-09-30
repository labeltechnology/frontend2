import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import { useCreerPosteEntretien, useModifierPosteEntretien } from "@/features/entretien/api";
import { LIBELLES_PORTEE } from "@/features/referentiels-fiche/libelles";
import { ApiError } from "@/lib/api-client";
import type { PosteEntretien } from "@/types/entretien";
import type { PorteeCategorie } from "@/types/equipement-bord";
import { toast } from "sonner";

/** Intervalle facultatif : vide = non utilisé ; sinon entier strictement positif. */
const intervalle = z
  .string()
  .optional()
  .refine((v) => !v || !v.trim() || (Number.isInteger(Number(v)) && Number(v) > 0), "Entier positif attendu");

const schema = z
  .object({
    libelle: z.string().trim().min(1, "Requis").max(150, "150 caractères maximum"),
    intervalleKm: intervalle,
    intervalleHeures: intervalle,
    intervalleMois: intervalle,
    portee: z.enum(["TOUS", "VEHICULE_ROUTIER", "ENGIN_CHANTIER"]),
    ordre: z.coerce.number().int("Nombre entier attendu").min(0, "Positif ou nul"),
  })
  .refine((v) => !!(v.intervalleKm?.trim() || v.intervalleHeures?.trim() || v.intervalleMois?.trim()), {
    message: "Indiquez au moins un intervalle",
    path: ["intervalleMois"],
  });

type FormValues = z.infer<typeof schema>;

const versEntier = (v: string | undefined) => (v && v.trim() ? Number(v) : undefined);

interface PosteEntretienFormDialogProps {
  poste: PosteEntretien | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Poste d'entretien périodique. Modifier un intervalle recalcule côté
 * backend les échéances de tous les engins qui suivent ce poste.
 */
export function PosteEntretienFormDialog({ poste, open, onOpenChange }: PosteEntretienFormDialogProps) {
  const creer = useCreerPosteEntretien();
  const modifier = useModifierPosteEntretien();
  const enEdition = poste != null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    const texte = (n: number | null | undefined) => (n == null ? "" : String(n));
    reset(
      poste
        ? {
            libelle: poste.libelle,
            intervalleKm: texte(poste.intervalleKm),
            intervalleHeures: texte(poste.intervalleHeures),
            intervalleMois: texte(poste.intervalleMois),
            portee: poste.portee,
            ordre: poste.ordre,
          }
        : { libelle: "", intervalleKm: "", intervalleHeures: "", intervalleMois: "", portee: "TOUS", ordre: 0 },
    );
  }, [open, poste, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = {
      libelle: values.libelle.trim(),
      intervalleKm: versEntier(values.intervalleKm),
      intervalleHeures: versEntier(values.intervalleHeures),
      intervalleMois: versEntier(values.intervalleMois),
      portee: values.portee,
      ordre: values.ordre,
    };
    try {
      if (enEdition) {
        await modifier.mutateAsync({ id: poste.idPosteEntretien, requete });
        toast.success("Poste modifié — échéances recalculées");
      } else {
        await creer.mutateAsync(requete);
        toast.success("Poste ajouté");
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
          <DialogTitle>{enEdition ? "Modifier le poste d'entretien" : "Nouveau poste d'entretien"}</DialogTitle>
          <DialogDescription>
            L'échéance tombe au premier intervalle atteint. Kilomètres pour les véhicules routiers, heures moteur pour
            les engins de chantier.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle-poste">Libellé</Label>
            <Input id="libelle-poste" {...register("libelle")} />
            {errors.libelle && <p className="text-sm text-destructive">{errors.libelle.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="intervalle-km">Tous les … km</Label>
              <Input id="intervalle-km" inputMode="numeric" {...register("intervalleKm")} />
              {errors.intervalleKm && <p className="text-sm text-destructive">{errors.intervalleKm.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervalle-heures">Toutes les … heures</Label>
              <Input id="intervalle-heures" inputMode="numeric" {...register("intervalleHeures")} />
              {errors.intervalleHeures && <p className="text-sm text-destructive">{errors.intervalleHeures.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervalle-mois">Tous les … mois</Label>
              <Input id="intervalle-mois" inputMode="numeric" {...register("intervalleMois")} />
              {errors.intervalleMois && <p className="text-sm text-destructive">{errors.intervalleMois.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="portee-poste">S'applique à</Label>
              <Controller
                control={control}
                name="portee"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="portee-poste">
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
            <div className="space-y-2">
              <Label htmlFor="ordre-poste">Ordre d'affichage</Label>
              <Input id="ordre-poste" inputMode="numeric" {...register("ordre")} />
              {errors.ordre && <p className="text-sm text-destructive">{errors.ordre.message}</p>}
            </div>
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
