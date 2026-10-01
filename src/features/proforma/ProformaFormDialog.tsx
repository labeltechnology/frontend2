import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useParametresEntreprise } from "@/features/parametres/api";
import { useCreerFactureProforma } from "@/features/proforma/api";
import { ApiError } from "@/lib/api-client";
import { formatMontant } from "@/lib/utils";
import { toast } from "sonner";

const ligneSchema = z.object({
  libelle: z.string().min(1, "Libellé requis"),
  prixUnitaire: z.coerce.number().min(0, "Doit être positif"),
  quantite: z.coerce.number().positive("Doit être supérieur à 0"),
  // Nombre de jours facturés pour cette ligne (ex. location d'engin) — 1 par
  // défaut pour une prestation ponctuelle, sans effet sur le total dans ce cas.
  nombreJours: z.coerce.number().int().positive("Doit être supérieur à 0"),
});

const schema = z.object({
  clientNom: z.string().min(1, "Le nom du client est obligatoire"),
  clientContact: z.string().optional(),
  clientTelephone: z.string().optional(),
  clientAdresse: z.string().optional(),
  validiteJours: z.coerce.number().int().positive().optional().or(z.literal("")),
  mentionPied: z.string().optional(),
  lignes: z.array(ligneSchema).min(1, "Au moins une ligne de prestation est requise"),
});

type FormValues = z.infer<typeof schema>;

const LIGNE_VIDE = { libelle: "", prixUnitaire: 0, quantite: 1, nombreJours: 1 };

interface ProformaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Création d'une facture proforma — document libre et indépendant (devis),
 * non lié à un contrat de location existant (choix confirmé avec
 * l'utilisateur, en réponse à « ajoute aussi une creation de facture
 * proforma pour nous ») : destinataire et lignes de prestations saisis
 * manuellement, avec ajout/suppression de lignes.
 *
 * Chaque ligne a un champ "Jours" (défaut 1) en plus de la quantité — ajouté
 * pour corriger la facturation d'une location d'engin, qui doit être
 * calculée par engin ET par jour (ex. 2 engins x 5 jours), pas seulement par
 * quantité. Sans effet sur une prestation ponctuelle (jours = 1).
 */
export function ProformaFormDialog({ open, onOpenChange }: ProformaFormDialogProps) {
  const { data: parametres } = useParametresEntreprise();
  const creer = useCreerFactureProforma();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { clientNom: "", lignes: [LIGNE_VIDE] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lignes" });
  const lignesSaisies = watch("lignes");

  const montantHt = lignesSaisies.reduce(
    (somme, l) =>
      somme + (Number(l.prixUnitaire) || 0) * (Number(l.quantite) || 0) * (Number(l.nombreJours) || 1),
    0,
  );
  const tauxTva = parametres?.tauxTvaPourcent ?? 0;
  const montantTtc = montantHt * (1 + tauxTva / 100);

  const onSubmit = async (values: FormValues) => {
    try {
      await creer.mutateAsync({
        clientNom: values.clientNom,
        clientContact: values.clientContact || undefined,
        clientTelephone: values.clientTelephone || undefined,
        clientAdresse: values.clientAdresse || undefined,
        validiteJours: values.validiteJours === "" || values.validiteJours == null ? undefined : Number(values.validiteJours),
        mentionPied: values.mentionPied || undefined,
        lignes: values.lignes.map((l) => ({
          libelle: l.libelle,
          prixUnitaire: Number(l.prixUnitaire),
          quantite: Number(l.quantite),
          nombreJours: Number(l.nombreJours),
        })),
      });
      toast.success("Facture pro forma créée");
      reset({ clientNom: "", lignes: [LIGNE_VIDE] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Création de la facture pro forma impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouvelle facture pro forma</DialogTitle>
          <DialogDescription>Devis non engageant, non lié à un contrat existant.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="clientNom">Client ou destinataire</Label>
              <Input id="clientNom" {...register("clientNom")} />
              {errors.clientNom && <p className="text-sm text-destructive">{errors.clientNom.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientContact">Personne à contacter</Label>
              <Input id="clientContact" {...register("clientContact")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientTelephone">Téléphone</Label>
              <Input id="clientTelephone" {...register("clientTelephone")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="clientAdresse">Adresse</Label>
              <Input id="clientAdresse" {...register("clientAdresse")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validiteJours">Validité du devis (jours, facultatif)</Label>
              <Input id="validiteJours" type="number" min={1} {...register("validiteJours")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lignes de prestations</Label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <Input placeholder="Libellé" {...register(`lignes.${index}.libelle` as const)} />
                  </div>
                  <div className="w-28 space-y-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Prix unitaire"
                      {...register(`lignes.${index}.prixUnitaire` as const)}
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Quantité"
                      {...register(`lignes.${index}.quantite` as const)}
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Input
                      type="number"
                      min={1}
                      step="1"
                      title="Nombre de jours (location de véhicule) — laisser à 1 pour une prestation ponctuelle"
                      placeholder="Jours"
                      {...register(`lignes.${index}.nombreJours` as const)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Retirer la ligne"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.lignes && !Array.isArray(errors.lignes) && (
              <p className="text-sm text-destructive">{errors.lignes.message}</p>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => append(LIGNE_VIDE)}>
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentionPied">Mention complémentaire (facultative)</Label>
            <Textarea id="mentionPied" rows={2} {...register("mentionPied")} />
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            Total HT : {formatMontant(montantHt)} — TVA {tauxTva}% — Total TTC estimé :{" "}
            <span className="font-medium">{formatMontant(montantTtc)}</span>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer la facture pro forma
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
