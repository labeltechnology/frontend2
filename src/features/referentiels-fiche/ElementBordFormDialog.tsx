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
import { useCreerElementBord, useModifierElementBord } from "@/features/equipements-bord/api";
import { LIBELLES_CATEGORIE_ELEMENT, LIBELLES_PORTEE } from "@/features/referentiels-fiche/libelles";
import { ApiError } from "@/lib/api-client";
import type { CategorieElementBord, ElementBord, PorteeCategorie } from "@/types/equipement-bord";
import { toast } from "sonner";

const schema = z.object({
  libelle: z.string().trim().min(1, "Requis").max(150, "150 caractères maximum"),
  categorie: z.enum(["SECURITE", "OUTIL"]),
  portee: z.enum(["TOUS", "VEHICULE_ROUTIER", "ENGIN_CHANTIER"]),
  ordre: z.coerce.number().int("Nombre entier attendu").min(0, "Positif ou nul"),
});

type FormValues = z.infer<typeof schema>;

interface ElementBordFormDialogProps {
  /** Présent = édition ; null = création (même patron que TypeEnginFormDialog). */
  element: ElementBord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ElementBordFormDialog({ element, open, onOpenChange }: ElementBordFormDialogProps) {
  const creer = useCreerElementBord();
  const modifier = useModifierElementBord();
  const enEdition = element != null;

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
      element
        ? { libelle: element.libelle, categorie: element.categorie, portee: element.portee, ordre: element.ordre }
        : { libelle: "", categorie: "SECURITE", portee: "TOUS", ordre: 0 },
    );
  }, [open, element, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = { ...values, libelle: values.libelle.trim() };
    try {
      if (enEdition) {
        await modifier.mutateAsync({ id: element.idElementBord, requete });
        toast.success("Élément modifié");
      } else {
        await creer.mutateAsync(requete);
        toast.success("Élément ajouté");
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
          <DialogTitle>{enEdition ? "Modifier l'élément de bord" : "Nouvel élément de bord"}</DialogTitle>
          <DialogDescription>Ligne « OUI/NON + observation » de la fiche véhicule.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle-element">Libellé</Label>
            <Input id="libelle-element" {...register("libelle")} />
            {errors.libelle && <p className="text-sm text-destructive">{errors.libelle.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categorie-element">Rubrique</Label>
              <Controller
                control={control}
                name="categorie"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="categorie-element">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LIBELLES_CATEGORIE_ELEMENT) as CategorieElementBord[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {LIBELLES_CATEGORIE_ELEMENT[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portee-element">S'applique à</Label>
              <Controller
                control={control}
                name="portee"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="portee-element">
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
            <Label htmlFor="ordre-element">Ordre d'affichage</Label>
            <Input id="ordre-element" inputMode="numeric" {...register("ordre")} />
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
