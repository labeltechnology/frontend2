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
import { useCreerContratLocationEntrante } from "@/features/location-entrante/api";
import { usePrestatairesLocation } from "@/features/prestataire-location/api";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

const schema = z.object({
  idEngin: z.string().min(1, "Requis"),
  idPrestataire: z.string().min(1, "Requis"),
  referenceContrat: z.string().optional(),
  dateDebut: z.string().min(1, "Requis"),
  dateFinPrevue: z.string().optional(),
  conditions: z.string().optional(),
  tarifJournalier: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ContratLocationEntranteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Règle validée avec l'utilisateur : l'engin est loué CHEZ un prestataire
 * externe pour l'usage de l'entreprise (sens inverse de « Locations
 * externes ») et ne peut avoir qu'un seul contrat de location entrante ACTIF
 * à la fois — le backend (ContratLocationEntranteService.creer) rejette la
 * création si un contrat actif existe déjà pour le véhicule choisi. L'engin doit
 * déjà exister (créé au préalable via l'écran Véhicules, comme n'importe quel
 * autre engin) : ce formulaire se contente de le rattacher à un prestataire.
 *
 * Le prestataire est choisi dans la liste maîtresse (page « Prestataires de
 * location ») plutôt que saisi en texte libre — demande explicite de
 * l'utilisateur (« une section prestataire au lieu d'ecrire tous le temps
 * sur la location entrant »). Seuls les prestataires actifs sont proposés ;
 * un prestataire désactivé reste néanmoins visible sur les contrats déjà
 * créés (via nomPrestataire renvoyé par l'API).
 */
export function ContratLocationEntranteFormDialog({ open, onOpenChange }: ContratLocationEntranteFormDialogProps) {
  const { data: engins } = useEngins();
  const { data: prestataires } = usePrestatairesLocation();
  const creerContrat = useCreerContratLocationEntrante();
  const prestatairesActifs = prestataires?.filter((p) => p.actif) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) reset({ idEngin: "", idPrestataire: "", dateDebut: "" });
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await creerContrat.mutateAsync({
        idEngin: Number(values.idEngin),
        idPrestataire: Number(values.idPrestataire),
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
          <DialogTitle>Nouveau contrat de location entrante</DialogTitle>
          <DialogDescription>
            Loue un engin déjà présent dans le parc chez un prestataire externe, pour l'usage de l'entreprise.
          </DialogDescription>
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
              <Label>Prestataire</Label>
              <Select value={watch("idPrestataire")} onValueChange={(v) => setValue("idPrestataire", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {prestatairesActifs.map((p) => (
                    <SelectItem key={p.idPrestataireLocation} value={String(p.idPrestataireLocation)}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.idPrestataire && <p className="text-sm text-destructive">{errors.idPrestataire.message}</p>}
              {prestatairesActifs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun prestataire actif — créez-en un depuis la page « Prestataires de location ».
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referenceContrat">Référence du contrat</Label>
              <Input id="referenceContrat" {...register("referenceContrat")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarifJournalier">Tarif journalier</Label>
              <Input id="tarifJournalier" type="number" min={0} step="0.01" {...register("tarifJournalier")} />
            </div>
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
