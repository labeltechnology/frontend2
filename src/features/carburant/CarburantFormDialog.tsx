import { useEffect, useState } from "react";
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
import { useConducteurs } from "@/features/conducteurs/api";
import { useEngins } from "@/features/engins/api";
import { useEnregistrerCarburant } from "@/features/carburant/api";
import { LIBELLES_APPROVISIONNEMENT, TYPES_APPROVISIONNEMENT } from "@/features/carburant/approvisionnement";
import type { TypeApprovisionnement } from "@/types/carburant";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";
import { aCompteurHoraire, lireCompteurHeures } from "@/features/engins/compteur-vehicule";
import { LienAide } from "@/features/aide/LienAide";
import { ConfirmationSaisieDialog, estSaisieAConfirmer } from "@/features/carburant/ConfirmationSaisieDialog";
import type { CreerCarburantRequest } from "@/types/carburant";

const schema = z.object({
  idEngin: z.string().min(1, "Requis"),
  idConducteur: z.string().optional(),
  dateHeure: z.string().min(1, "Requis"),
  kilometrageAuPlein: z.coerce.number().min(0, "Doit être positif"),
  quantiteLitres: z.coerce.number().positive("Doit être positif"),
  prixUnitaire: z.coerce.number().positive("Doit être positif"),
  station: z.string().optional(),
  // Compteur horaire des engins de chantier (facultatif, 2026-09-28) : champ vide = non relevé.
  compteurHeures: z
    .string()
    .optional()
    .refine((v) => lireCompteurHeures(v ?? "") !== null, "Doit être un nombre positif"),
  // Plein complet par défaut ; appoint ou bidon quand le réservoir n'est pas rempli (2026-09-28).
  typeApprovisionnement: z.enum(TYPES_APPROVISIONNEMENT as readonly [TypeApprovisionnement, ...TypeApprovisionnement[]]),
});

type FormValues = z.infer<typeof schema>;

interface CarburantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Véhicule présélectionné à l'ouverture (2026-09-25 : bouton de la carte
   * « Carburant » du rapport véhicule) ; absent = choix libre, comme avant.
   */
  idEnginInitial?: number | null;
}

export function CarburantFormDialog({ open, onOpenChange, idEnginInitial = null }: CarburantFormDialogProps) {
  const { data: engins } = useEngins();
  const { data: conducteurs } = useConducteurs();
  const enregistrer = useEnregistrerCarburant();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { typeApprovisionnement: "PLEIN_COMPLET" } });

  useEffect(() => {
    if (!open) reset({ typeApprovisionnement: "PLEIN_COMPLET" });
    else if (idEnginInitial != null) setValue("idEngin", String(idEnginInitial));
  }, [open, reset, setValue, idEnginInitial]);

  const enginChoisi = engins?.find((e) => String(e.idEngin) === watch("idEngin"));
  const enginChantier = aCompteurHoraire(enginChoisi);

  // Saisie douteuse en attente de confirmation (qualité des saisies, 2026-09-29).
  const [aConfirmer, setAConfirmer] = useState<{ requete: CreerCarburantRequest; libelle: string; points: string[] } | null>(null);

  const envoyer = async (requete: CreerCarburantRequest, libelle: string, confirmer: boolean) => {
    try {
      await enregistrer.mutateAsync({ ...requete, confirmer });
      toast.success(confirmer ? `${libelle} enregistré — une alerte « Saisie à vérifier » a été créée` : `${libelle} enregistré`);
      setAConfirmer(null);
      onOpenChange(false);
    } catch (e) {
      if (!confirmer && estSaisieAConfirmer(e)) {
        setAConfirmer({ requete, libelle, points: e.details });
        return;
      }
      toast.error(e instanceof ApiError ? e.message : "Impossible d'enregistrer le plein");
    }
  };

  const onSubmit = async (values: FormValues) => {
    await envoyer(
      {
        idEngin: Number(values.idEngin),
        idConducteur: values.idConducteur ? Number(values.idConducteur) : undefined,
        dateHeure: values.dateHeure,
        kilometrageAuPlein: values.kilometrageAuPlein,
        quantiteLitres: values.quantiteLitres,
        prixUnitaire: values.prixUnitaire,
        station: values.station || undefined,
        typeApprovisionnement: values.typeApprovisionnement,
        compteurHeures: enginChantier ? (lireCompteurHeures(values.compteurHeures ?? "") ?? undefined) : undefined,
      },
      LIBELLES_APPROVISIONNEMENT[values.typeApprovisionnement],
      false,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saisie de carburant</DialogTitle>
          <DialogDescription>
            Plein complet, appoint ou bidon. La consommation se calcule de plein complet à plein complet ; les appoints et
            bidons entre les deux y sont comptés.
          </DialogDescription>
          <LienAide idPage="guide-enregistrer-plein" libelle="Comment faire ?" />
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
              <Label>Conducteur (facultatif)</Label>
              <Select value={watch("idConducteur")} onValueChange={(v) => setValue("idConducteur", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {conducteurs?.map((c) => (
                    <SelectItem key={c.idConducteur} value={String(c.idConducteur)}>
                      {c.nom} {c.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1" role="radiogroup" aria-label="Type de saisie">
              {TYPES_APPROVISIONNEMENT.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={watch("typeApprovisionnement") === t}
                  onClick={() => setValue("typeApprovisionnement", t)}
                  className={
                    watch("typeApprovisionnement") === t
                      ? "rounded bg-background px-2 py-1.5 text-sm font-medium text-foreground shadow-sm"
                      : "rounded px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {LIBELLES_APPROVISIONNEMENT[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateHeure">Date et heure</Label>
            <Input id="dateHeure" type="datetime-local" {...register("dateHeure")} />
            {errors.dateHeure && <p className="text-sm text-destructive">{errors.dateHeure.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kilometrageAuPlein">Kilométrage</Label>
              <Input id="kilometrageAuPlein" type="number" min={0} {...register("kilometrageAuPlein")} />
              {errors.kilometrageAuPlein && (
                <p className="text-sm text-destructive">{errors.kilometrageAuPlein.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantiteLitres">Litres</Label>
              <Input id="quantiteLitres" type="number" step="0.01" min={0} {...register("quantiteLitres")} />
              {errors.quantiteLitres && <p className="text-sm text-destructive">{errors.quantiteLitres.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="prixUnitaire">Prix au litre</Label>
              <Input id="prixUnitaire" type="number" step="0.01" min={0} {...register("prixUnitaire")} />
              {errors.prixUnitaire && <p className="text-sm text-destructive">{errors.prixUnitaire.message}</p>}
            </div>
          </div>
          {enginChantier && (
            <div className="space-y-2">
              <Label htmlFor="compteurHeures">Compteur horaire (h, facultatif)</Label>
              <Input id="compteurHeures" type="number" step="0.1" min={0} {...register("compteurHeures")} />
              <p className="text-xs text-muted-foreground">
                Relevé à chaque plein : il sert à calculer les heures travaillées de l'engin.
              </p>
              {errors.compteurHeures && <p className="text-sm text-destructive">{errors.compteurHeures.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="station">Station (facultatif)</Label>
            <Input id="station" {...register("station")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmationSaisieDialog
        points={aConfirmer?.points ?? null}
        enCours={enregistrer.isPending}
        onCorriger={() => setAConfirmer(null)}
        onConfirmer={() => aConfirmer && envoyer(aConfirmer.requete, aConfirmer.libelle, true)}
      />
    </Dialog>
  );
}
