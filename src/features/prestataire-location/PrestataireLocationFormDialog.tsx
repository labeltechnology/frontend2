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
import { useCreerPrestataireLocation, useModifierPrestataireLocation } from "@/features/prestataire-location/api";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { ApiError } from "@/lib/api-client";
import type { PrestataireLocation } from "@/types/prestataire-location";
import { toast } from "sonner";

const schema = z.object({
  nom: z.string().min(1, "Requis"),
  personneContact: z.string().optional(),
  telephone: z.string().optional(),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional(),
  adresse: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PrestataireLocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Présent = édition d'un prestataire existant ; absent = création. */
  prestataire?: PrestataireLocation | null;
}

/** Un seul dialogue pour créer et modifier — mêmes champs, seule la mutation appelée diffère (mirroir de FournisseurFormDialog). */
export function PrestataireLocationFormDialog({ open, onOpenChange, prestataire }: PrestataireLocationFormDialogProps) {
  const creer = useCreerPrestataireLocation();
  const modifier = useModifierPrestataireLocation();
  const enEdition = !!prestataire;
  // Avis si ce prestataire est modifié ailleurs pendant la saisie (temps réel, 2026-09-29).
  useEditionEnCours("prestataires-location", open ? prestataire?.idPrestataireLocation : undefined);

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
    if (prestataire) {
      reset({
        nom: prestataire.nom,
        personneContact: prestataire.personneContact ?? "",
        telephone: prestataire.telephone ?? "",
        email: prestataire.email ?? "",
        adresse: prestataire.adresse ?? "",
      });
    }
  }, [open, prestataire, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = {
      nom: values.nom,
      personneContact: values.personneContact || undefined,
      telephone: values.telephone || undefined,
      email: values.email || undefined,
      adresse: values.adresse || undefined,
    };
    try {
      if (enEdition && prestataire) {
        await modifier.mutateAsync({ id: prestataire.idPrestataireLocation, requete });
        toast.success("Prestataire modifié");
      } else {
        await creer.mutateAsync(requete);
        toast.success("Prestataire créé");
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
          <DialogTitle>{enEdition ? "Modifier le prestataire" : "Nouveau prestataire"}</DialogTitle>
          <DialogDescription>Prestataire externe auprès duquel l'entreprise peut louer un véhicule.</DialogDescription>
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
