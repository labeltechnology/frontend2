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
import { useCreerFournisseur, useModifierFournisseur } from "@/features/fournisseurs/api";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { ApiError } from "@/lib/api-client";
import type { Fournisseur } from "@/types/fournisseur";
import { toast } from "sonner";

const schema = z.object({
  nom: z.string().min(1, "Requis"),
  personneContact: z.string().optional(),
  telephone: z.string().optional(),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional(),
  adresse: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FournisseurFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Présent = édition d'un fournisseur existant ; absent = création. */
  fournisseur?: Fournisseur | null;
}

/** Un seul dialogue pour créer et modifier — mêmes champs, seule la mutation appelée diffère. */
export function FournisseurFormDialog({ open, onOpenChange, fournisseur }: FournisseurFormDialogProps) {
  const creer = useCreerFournisseur();
  const modifier = useModifierFournisseur();
  const enEdition = !!fournisseur;
  // Avis si ce fournisseur est modifié ailleurs pendant la saisie (temps réel, 2026-09-29).
  useEditionEnCours("fournisseurs", open ? fournisseur?.idFournisseur : undefined);

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
    if (fournisseur) {
      reset({
        nom: fournisseur.nom,
        personneContact: fournisseur.personneContact ?? "",
        telephone: fournisseur.telephone ?? "",
        email: fournisseur.email ?? "",
        adresse: fournisseur.adresse ?? "",
      });
    }
  }, [open, fournisseur, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = {
      nom: values.nom,
      personneContact: values.personneContact || undefined,
      telephone: values.telephone || undefined,
      email: values.email || undefined,
      adresse: values.adresse || undefined,
    };
    try {
      if (enEdition && fournisseur) {
        await modifier.mutateAsync({ id: fournisseur.idFournisseur, requete });
        toast.success("Fournisseur modifié");
      } else {
        await creer.mutateAsync(requete);
        toast.success("Fournisseur créé");
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
          <DialogTitle>{enEdition ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
          <DialogDescription>Fournisseur de pièces détachées pour la maintenance.</DialogDescription>
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
