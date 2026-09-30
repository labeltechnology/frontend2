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
import { useCreerTypeEngin, useModifierTypeEngin } from "@/features/engins/api";
import { ApiError } from "@/lib/api-client";
import type { CategorieEngin, TypeEngin } from "@/types/engin";
import { lireNombreFacultatif, uniteUsage, versChamp } from "@/features/performance/reglages-type";
import { toast } from "sonner";

const schema = z.object({
  libelle: z.string().min(1, "Requis"),
  vitesseMaximale: z.coerce.number().positive("Doit être positive"),
  categorie: z.enum(["VEHICULE_ROUTIER", "ENGIN_CHANTIER"]),
  // Performance et utilisation (2026-09-28) : tout facultatif, champ vide = non réglé.
  seuilTauxJours: z.string().optional().refine((v) => lireNombreFacultatif(v, 100) !== null, "Entre 0 et 100"),
  seuilUsageMensuel: z.string().optional().refine((v) => lireNombreFacultatif(v) !== null, "Nombre positif"),
  coutReferenceUnite: z.string().optional().refine((v) => lireNombreFacultatif(v) !== null, "Nombre positif"),
});

type FormValues = z.infer<typeof schema>;

const LIBELLES_CATEGORIE: Record<CategorieEngin, string> = {
  VEHICULE_ROUTIER: "Véhicule routier (immatriculation)",
  ENGIN_CHANTIER: "Engin de chantier (numéro de série)",
};

interface TypeEnginFormDialogProps {
  /** Présent = édition ; absent (null) = création — même patron qu'un seul dialogue création/édition déjà utilisé ailleurs (ex. PrestataireLocationFormDialog). */
  typeEngin: TypeEngin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Ajouté le 2026-09-22 : jusque-là les types d'engin étaient créés
 * directement en base, faute d'écran (voir TypeEnginController, historique).
 * La catégorie choisie ici détermine, côté fiche engin, si c'est
 * l'immatriculation ou le numéro de série qui est demandé (voir
 * EnginFormDialog).
 */
export function TypeEnginFormDialog({ typeEngin, open, onOpenChange }: TypeEnginFormDialogProps) {
  const creerTypeEngin = useCreerTypeEngin();
  const modifierTypeEngin = useModifierTypeEngin();
  const enEdition = typeEngin != null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (typeEngin) {
      reset({
        libelle: typeEngin.libelle,
        vitesseMaximale: typeEngin.vitesseMaximale ?? undefined,
        categorie: typeEngin.categorie,
        seuilTauxJours: versChamp(typeEngin.seuilTauxJours),
        seuilUsageMensuel: versChamp(typeEngin.seuilUsageMensuel),
        coutReferenceUnite: versChamp(typeEngin.coutReferenceUnite),
      });
    } else {
      reset({
        libelle: "",
        vitesseMaximale: undefined,
        categorie: "VEHICULE_ROUTIER",
        seuilTauxJours: "",
        seuilUsageMensuel: "",
        coutReferenceUnite: "",
      });
    }
  }, [open, typeEngin, reset]);

  const unite = uniteUsage(watch("categorie"));

  const onSubmit = async (values: FormValues) => {
    const requete = {
      libelle: values.libelle,
      vitesseMaximale: values.vitesseMaximale,
      categorie: values.categorie,
      seuilTauxJours: lireNombreFacultatif(values.seuilTauxJours, 100) ?? null,
      seuilUsageMensuel: lireNombreFacultatif(values.seuilUsageMensuel) ?? null,
      coutReferenceUnite: lireNombreFacultatif(values.coutReferenceUnite) ?? null,
    };
    try {
      if (enEdition) {
        await modifierTypeEngin.mutateAsync({ id: typeEngin.idTypeEngin, requete });
        toast.success("Type de véhicule modifié");
      } else {
        await creerTypeEngin.mutateAsync(requete);
        toast.success("Type de véhicule créé");
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
          <DialogTitle>{enEdition ? "Modifier le type de véhicule" : "Nouveau type de véhicule"}</DialogTitle>
          <DialogDescription>
            La catégorie détermine l'identifiant exigé sur la fiche d'un engin de ce type (immatriculation ou
            numéro de série).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé</Label>
            <Input id="libelle" {...register("libelle")} />
            {errors.libelle && <p className="text-sm text-destructive">{errors.libelle.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="vitesseMaximale">Vitesse maximale (km/h)</Label>
            <Input id="vitesseMaximale" type="number" step="0.1" {...register("vitesseMaximale")} />
            {errors.vitesseMaximale && (
              <p className="text-sm text-destructive">{errors.vitesseMaximale.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={watch("categorie")} onValueChange={(v) => setValue("categorie", v as CategorieEngin)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LIBELLES_CATEGORIE) as CategorieEngin[]).map((categorie) => (
                  <SelectItem key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE[categorie]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categorie && <p className="text-sm text-destructive">{errors.categorie.message}</p>}
          </div>
          <fieldset className="space-y-3 rounded-md border border-border p-3">
            <legend className="px-1 text-sm font-medium">Performance et utilisation (facultatif)</legend>
            <p className="text-xs text-muted-foreground">
              Un véhicule de ce type est « sous-utilisé » s'il est sous l'un des deux seuils. Le coût de référence sert
              à comparer le coût réel par {unite === "h" ? "heure" : "km"}.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="seuilTauxJours">Seuil d'utilisation (% des jours)</Label>
                <Input id="seuilTauxJours" type="number" step="1" min={0} max={100} placeholder="ex. 50" {...register("seuilTauxJours")} />
                {errors.seuilTauxJours && <p className="text-sm text-destructive">{errors.seuilTauxJours.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seuilUsageMensuel">Seuil d'usage ({unite}/mois)</Label>
                <Input id="seuilUsageMensuel" type="number" step="1" min={0} placeholder={unite === "h" ? "ex. 100" : "ex. 1500"} {...register("seuilUsageMensuel")} />
                {errors.seuilUsageMensuel && <p className="text-sm text-destructive">{errors.seuilUsageMensuel.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coutReferenceUnite">Coût de référence (Ar/{unite})</Label>
                <Input id="coutReferenceUnite" type="number" step="1" min={0} placeholder={unite === "h" ? "ex. 50000" : "ex. 400"} {...register("coutReferenceUnite")} />
                {errors.coutReferenceUnite && <p className="text-sm text-destructive">{errors.coutReferenceUnite.message}</p>}
              </div>
            </div>
          </fieldset>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {enEdition ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
