import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { useCreerBesoinMaterielChantier, useCreerChantier, useModifierChantier } from "@/features/chantiers/api";
import { useTypesEngin } from "@/features/engins/api";
import { ApiError } from "@/lib/api-client";
import type { Chantier } from "@/types/chantier";
import { toast } from "sonner";

const schema = z
  .object({
    nom: z.string().min(1, "Requis"),
    lieu: z.string().optional(),
    dateDebutPrevue: z.string().min(1, "Requis"),
    dateFinPrevue: z.string().min(1, "Requis"),
    description: z.string().optional(),
  })
  .refine((v) => v.dateFinPrevue >= v.dateDebutPrevue, {
    message: "La date de fin ne peut pas précéder la date de début",
    path: ["dateFinPrevue"],
  });

type FormValues = z.infer<typeof schema>;

interface LigneBesoin {
  idTypeEngin: string;
  quantite: string;
}

interface ChantierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Présent = édition d'un chantier existant ; absent = création. */
  chantier?: Chantier;
}

/**
 * Formulaire de création/édition d'un chantier. La modification est
 * bloquée côté backend (et donc désactivée dans la page listant les
 * chantiers) pour un chantier terminé ou annulé — voir Chantier#estModifiable().
 *
 * <p>Depuis le 2026-09-23 (demande explicite de l'utilisateur — « au moment
 * de la création de chantier il faut aussi le besoin en matière d'engin et
 * véhicule ») : à la CRÉATION uniquement, une section « Besoins en
 * matériel » permet de saisir directement les types de véhicules
 * nécessaires et leur quantité — créés juste après le chantier lui-même
 * (son id n'existe qu'une fois la création confirmée). En édition, cette
 * section n'est pas reprise ici (pas de reconciliation add/modif/suppression
 * dans ce formulaire) : les besoins existants se gèrent ensuite via le
 * dialogue dédié « Besoins en matériel » sur la liste des chantiers, même
 * principe que les rattachements engins/conducteurs.
 */
export function ChantierFormDialog({ open, onOpenChange, chantier }: ChantierFormDialogProps) {
  const creerChantier = useCreerChantier();
  const modifierChantier = useModifierChantier();
  const creerBesoin = useCreerBesoinMaterielChantier();
  const { data: typesEngin } = useTypesEngin();
  const enEdition = chantier !== undefined;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [besoins, setBesoins] = useState<LigneBesoin[]>([]);

  useEffect(() => {
    if (!open) {
      reset();
      setBesoins([]);
      return;
    }
    if (chantier) {
      reset({
        nom: chantier.nom,
        lieu: chantier.lieu ?? "",
        dateDebutPrevue: chantier.dateDebutPrevue,
        dateFinPrevue: chantier.dateFinPrevue,
        description: chantier.description ?? "",
      });
    } else {
      reset({ nom: "", lieu: "", dateDebutPrevue: "", dateFinPrevue: "", description: "" });
      setBesoins([]);
    }
  }, [open, chantier, reset]);

  const ajouterLigneBesoin = () => setBesoins((b) => [...b, { idTypeEngin: "", quantite: "1" }]);
  const retirerLigneBesoin = (index: number) => setBesoins((b) => b.filter((_, i) => i !== index));
  const modifierLigneBesoin = (index: number, champ: keyof LigneBesoin, valeur: string) =>
    setBesoins((b) => b.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne)));

  const onSubmit = async (values: FormValues) => {
    const requete = {
      nom: values.nom,
      lieu: values.lieu || undefined,
      dateDebutPrevue: values.dateDebutPrevue,
      dateFinPrevue: values.dateFinPrevue,
      description: values.description || undefined,
    };
    try {
      if (enEdition && chantier) {
        await modifierChantier.mutateAsync({ id: chantier.idChantier, requete });
        toast.success("Chantier modifié");
      } else {
        const nouveauChantier = await creerChantier.mutateAsync(requete);
        const lignesValides = besoins.filter((b) => b.idTypeEngin && Number(b.quantite) > 0);
        for (const ligne of lignesValides) {
          await creerBesoin.mutateAsync({
            idChantier: nouveauChantier.idChantier,
            idTypeEngin: Number(ligne.idTypeEngin),
            quantite: Number(ligne.quantite),
          });
        }
        toast.success("Chantier créé");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible d'enregistrer le chantier");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{enEdition ? "Modifier le chantier" : "Nouveau chantier"}</DialogTitle>
          <DialogDescription>
            {enEdition
              ? "Corrigez les informations du chantier. Les besoins en matériel se gèrent depuis « Besoins en matériel », dans la liste."
              : "Créez un chantier auquel des véhicules et des conducteurs pourront être rattachés."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" {...register("nom")} />
            {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lieu">Lieu</Label>
            <Input id="lieu" {...register("lieu")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebutPrevue">Début prévu</Label>
              <Input id="dateDebutPrevue" type="date" {...register("dateDebutPrevue")} />
              {errors.dateDebutPrevue && (
                <p className="text-sm text-destructive">{errors.dateDebutPrevue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFinPrevue">Fin prévue</Label>
              <Input id="dateFinPrevue" type="date" {...register("dateFinPrevue")} />
              {errors.dateFinPrevue && <p className="text-sm text-destructive">{errors.dateFinPrevue.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          {!enEdition && (
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label>Besoins en matériel (facultatif)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={ajouterLigneBesoin}>
                  <Plus className="h-4 w-4" />
                  Ajouter un type
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Types de véhicules nécessaires et leur quantité, pour repérer en avance si la flotte
                suffira sur la période du chantier.
              </p>
              {besoins.map((ligne, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={ligne.idTypeEngin}
                    onValueChange={(v) => modifierLigneBesoin(index, "idTypeEngin", v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Type de véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesEngin
                        ?.filter((t) => t.actif)
                        .map((type) => (
                          <SelectItem key={type.idTypeEngin} value={String(type.idTypeEngin)}>
                            {type.libelle}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={ligne.quantite}
                    onChange={(e) => modifierLigneBesoin(index, "quantite", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => retirerLigneBesoin(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

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
