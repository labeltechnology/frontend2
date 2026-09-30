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
import { useCreerGarageExterne, useModifierGarageExterne } from "@/features/garages/api";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { ApiError } from "@/lib/api-client";
import type { GarageExterne } from "@/types/garage";
import { toast } from "sonner";

const schema = z.object({
  nom: z.string().min(1, "Requis"),
  personneContact: z.string().optional(),
  telephone: z.string().optional(),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional(),
  adresse: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface GarageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Présent = édition d'un garage existant ; absent = création. */
  garage?: GarageExterne | null;
}

export function GarageFormDialog({ open, onOpenChange, garage }: GarageFormDialogProps) {
  const creer = useCreerGarageExterne();
  const modifier = useModifierGarageExterne();
  const enEdition = !!garage;
  // Avis si ce garage est modifié ailleurs pendant la saisie (temps réel, 2026-09-29).
  useEditionEnCours("garages-externes", open ? garage?.idGarageExterne : undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) {
      reset({ nom: "", personneContact: "", telephone: "", email: "", adresse: "" });
      return;
    }
    if (garage) {
      reset({
        nom: garage.nom,
        personneContact: garage.personneContact ?? "",
        telephone: garage.telephone ?? "",
        email: garage.email ?? "",
        adresse: garage.adresse ?? "",
      });
    }
  }, [open, garage, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = {
      nom: values.nom,
      personneContact: values.personneContact || undefined,
      telephone: values.telephone || undefined,
      email: values.email || undefined,
      adresse: values.adresse || undefined,
    };
    try {
      if (enEdition && garage) {
        await modifier.mutateAsync({ id: garage.idGarageExterne, requete });
        toast.success("Garage modifié");
      } else {
        await creer.mutateAsync(requete);
        toast.success("Garage créé");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Opération impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{enEdition ? "Modifier le garage" : "Nouveau garage externe"}</DialogTitle>
          <DialogDescription>Garage pouvant réaliser une maintenance hors de l'atelier interne.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" {...register("nom")} />
            {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="personneContact">Personne à contacter</Label>
              <Input id="personneContact" {...register("personneContact")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" {...register("telephone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" {...register("adresse")} />
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
