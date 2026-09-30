import { useEffect, useMemo } from "react";
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
import { useCreerEngin, useModifierEngin, useTypesEngin } from "@/features/engins/api";
import { ApiError } from "@/lib/api-client";
import type { Engin } from "@/types/engin";
import { toast } from "sonner";

const schema = z.object({
  immatriculation: z.string().optional(),
  numeroSerie: z.string().optional(),
  numeroChassis: z.string().optional(),
  marque: z.string().min(1, "Requis"),
  modele: z.string().min(1, "Requis"),
  dateAcquisition: z.string().optional(),
  idTypeEngin: z.string().min(1, "Requis"),
});

type FormValues = z.infer<typeof schema>;

interface EnginFormDialogProps {
  /** Présent = édition ; absent (null) = création — même patron que TypeEnginFormDialog. */
  engin: Engin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Règle 6.13 : le type d'engin (choisi ici) détermine la vitesse maximale
 * autorisée.
 *
 * <p>Depuis le 2026-09-22 (demande explicite de l'utilisateur — « les
 * véhicules ne sont pas les mêmes que les véhicules ou camions »), le type
 * détermine aussi quel identifiant est exigé (voir CategorieEngin côté
 * types) : le champ Immatriculation/Numéro de série affiché change selon la
 * catégorie du type sélectionné. Le contrôle est fait ici avant soumission
 * (même patron que RapportFormDialog) — le backend applique de toute façon
 * la même règle via BusinessRuleException, ce contrôle n'est qu'un confort
 * pour éviter un aller-retour réseau inutile. Le sélecteur de type est donc
 * placé en premier pour que le formulaire s'adapte au fur et à mesure de la
 * saisie plutôt qu'à la fin.
 *
 * <p>Édition ajoutée le 2026-09-22 (jusque-là aucun moyen de modifier un
 * engin déjà créé depuis l'écran Engins) : même dialogue que la création,
 * en suivant le même patron « un seul dialogue création/édition » déjà
 * utilisé pour TypeEnginFormDialog — le statut, le kilométrage et
 * l'équipement GPS restent des actions séparées, pas modifiables ici (voir
 * EnginsPage).
 */
export function EnginFormDialog({ engin, open, onOpenChange }: EnginFormDialogProps) {
  const { data: typesEngin } = useTypesEngin();
  const creerEngin = useCreerEngin();
  const modifierEngin = useModifierEngin();
  const enEdition = engin != null;

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
    if (engin) {
      reset({
        immatriculation: engin.immatriculation ?? "",
        numeroSerie: engin.numeroSerie ?? "",
        numeroChassis: engin.numeroChassis ?? "",
        marque: engin.marque,
        modele: engin.modele,
        dateAcquisition: engin.dateAcquisition ?? "",
        idTypeEngin: String(engin.typeEngin.idTypeEngin),
      });
    } else {
      reset({
        immatriculation: "",
        numeroSerie: "",
        numeroChassis: "",
        marque: "",
        modele: "",
        dateAcquisition: "",
        idTypeEngin: "",
      });
    }
  }, [open, engin, reset]);

  const idTypeEnginSelectionne = watch("idTypeEngin");
  const typeSelectionne = useMemo(
    () => typesEngin?.find((t) => String(t.idTypeEngin) === idTypeEnginSelectionne),
    [typesEngin, idTypeEnginSelectionne],
  );
  const estEnginChantier = typeSelectionne?.categorie === "ENGIN_CHANTIER";

  const onSubmit = async (values: FormValues) => {
    if (!estEnginChantier && !values.immatriculation?.trim()) {
      toast.error("L'immatriculation est requise pour ce type de véhicule");
      return;
    }
    if (estEnginChantier && !values.numeroSerie?.trim()) {
      toast.error("Le numéro de série est requis pour ce type de véhicule (pas de plaque routière)");
      return;
    }
    const requete = {
      immatriculation: values.immatriculation || undefined,
      numeroSerie: values.numeroSerie || undefined,
      numeroChassis: values.numeroChassis || undefined,
      marque: values.marque,
      modele: values.modele,
      dateAcquisition: values.dateAcquisition || undefined,
      idTypeEngin: Number(values.idTypeEngin),
    };
    try {
      if (enEdition) {
        await modifierEngin.mutateAsync({ id: engin.idEngin, requete });
        toast.success("Véhicule modifié");
      } else {
        await creerEngin.mutateAsync({ ...requete, equipeGps: false });
        toast.success("Véhicule créé");
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
          <DialogTitle>{enEdition ? "Modifier le véhicule" : "Nouvel véhicule"}</DialogTitle>
          <DialogDescription>
            {enEdition ? "Corrige la fiche de ce véhicule." : "Ajoute un véhicule ou un engin de chantier au parc."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type de véhicule</Label>
            <Select value={watch("idTypeEngin")} onValueChange={(v) => setValue("idTypeEngin", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typesEngin
                  ?.filter((type) => type.actif || String(type.idTypeEngin) === idTypeEnginSelectionne)
                  .map((type) => (
                    <SelectItem key={type.idTypeEngin} value={String(type.idTypeEngin)}>
                      {type.libelle}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.idTypeEngin && <p className="text-sm text-destructive">{errors.idTypeEngin.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {estEnginChantier ? (
              <div className="space-y-2">
                <Label htmlFor="numeroSerie">Numéro de série</Label>
                <Input id="numeroSerie" {...register("numeroSerie")} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="immatriculation">Immatriculation</Label>
                <Input id="immatriculation" {...register("immatriculation")} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marque">Marque</Label>
              <Input id="marque" {...register("marque")} />
              {errors.marque && <p className="text-sm text-destructive">{errors.marque.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modele">Modèle</Label>
              <Input id="modele" {...register("modele")} />
              {errors.modele && <p className="text-sm text-destructive">{errors.modele.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroChassis">Numéro de châssis</Label>
              <Input id="numeroChassis" {...register("numeroChassis")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateAcquisition">Date d'acquisition</Label>
              <Input id="dateAcquisition" type="date" {...register("dateAcquisition")} />
            </div>
          </div>
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
