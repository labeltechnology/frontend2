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
import { useEngins } from "@/features/engins/api";
import { useCreerContratLocation } from "@/features/location-externe/api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

const schema = z.object({
  idEngin: z.string().min(1, "Requis"),
  nomSociete: z.string().min(1, "Requis"),
  personneContact: z.string().optional(),
  telephone: z.string().optional(),
  email: z.union([z.string().email("Email invalide"), z.literal("")]).optional(),
  adresse: z.string().optional(),
  referenceContrat: z.string().optional(),
  dateDebut: z.string().min(1, "Requis"),
  dateFinPrevue: z.string().optional(),
  conditions: z.string().optional(),
  tarifJournalier: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ContratLocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Règle validée avec l'utilisateur : l'engin est loué À une société externe
 * (l'entreprise reste propriétaire) et ne peut avoir qu'un seul contrat
 * ACTIF à la fois — le backend (ContratLocationExterneService.creer) rejette
 * la création si un contrat actif existe déjà pour l'engin choisi.
 */
export function ContratLocationFormDialog({ open, onOpenChange }: ContratLocationFormDialogProps) {
  const { data: engins } = useEngins();
  const creerContrat = useCreerContratLocation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) reset({ idEngin: "", nomSociete: "", dateDebut: "" });
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await creerContrat.mutateAsync({
        idEngin: Number(values.idEngin),
        nomSociete: values.nomSociete,
        personneContact: values.personneContact || undefined,
        telephone: values.telephone || undefined,
        email: values.email || undefined,
        adresse: values.adresse || undefined,
        referenceContrat: values.referenceContrat || undefined,
        dateDebut: values.dateDebut,
        dateFinPrevue: values.dateFinPrevue || undefined,
        conditions: values.conditions || undefined,
        tarifJournalier: values.tarifJournalier ? Number(values.tarifJournalier) : undefined,
      });
      toast.success("Contrat de location créé");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer le contrat");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau contrat de location externe</DialogTitle>
          <DialogDescription>Met un véhicule de l'entreprise à disposition d'une société externe.</DialogDescription>
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
              <Label htmlFor="nomSociete">Société locataire</Label>
              <Input id="nomSociete" {...register("nomSociete")} />
              {errors.nomSociete && <p className="text-sm text-destructive">{errors.nomSociete.message}</p>}
            </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceContrat">Référence du contrat</Label>
              <Input id="referenceContrat" {...register("referenceContrat")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" {...register("adresse")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input id="dateDebut" type="date" {...register("dateDebut")} />
              {errors.dateDebut && <p className="text-sm text-destructive">{errors.dateDebut.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFinPrevue">Date de fin prévue</Label>
              <Input id="dateFinPrevue" type="date" {...register("dateFinPrevue")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea id="conditions" rows={3} {...register("conditions")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tarifJournalier">Tarif journalier (optionnel — requis pour facturer ce contrat)</Label>
            <Input id="tarifJournalier" type="number" min={0} step="0.01" {...register("tarifJournalier")} />
          </div>
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
