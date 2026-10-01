import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
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
import { useConducteurs } from "@/features/conducteurs/api";
import { useEngins } from "@/features/engins/api";
import { useCreerMission, useModifierMission } from "@/features/missions/api";
import { useEditionEnCours } from "@/lib/temps-reel/edition";
import { ApiError } from "@/lib/api-client";
import type { Mission } from "@/types/mission";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";
import { LienAide } from "@/features/aide/LienAide";

const schema = z
  .object({
    motif: z.string().min(1, "Requis"),
    dateDebutPrevue: z.string().min(1, "Requis"),
    dateFinPrevue: z.string().min(1, "Requis"),
    idEngin: z.string().min(1, "Requis"),
    idConducteur: z.string().min(1, "Requis"),
  })
  .refine((v) => new Date(v.dateFinPrevue) > new Date(v.dateDebutPrevue), {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFinPrevue"],
  });

type FormValues = z.infer<typeof schema>;

interface CreationInitiale {
  idRessource: number;
  contexte: "conducteur" | "engin";
  jour: Date;
}

interface MissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Présent = édition d'une mission existante ; absent (ou null, valeur par
   * défaut) = création — même patron que ConducteurFormDialog/
   * EnginFormDialog (un seul dialogue pour la création et l'édition).
   * Ajouté le 2026-09-24, demande explicite de l'utilisateur : pouvoir
   * modifier une mission — y compris la réaffecter à un autre conducteur ou
   * engin — directement depuis le planning d'équipe (voir
   * PlanningRessources), en plus du glisser-déposer qui ne fait que changer
   * les dates. L'écran Missions (MissionsPage) continue à n'ouvrir ce
   * dialogue qu'en création, sans passer cette prop — comportement
   * inchangé.
   */
  mission?: Mission | null;
  /**
   * Pré-remplissage lors d'une création déclenchée par un clic sur une case
   * vide du planning d'équipe (ressource + jour cliqués). Ignoré si
   * `mission` est fourni.
   */
  creationInitiale?: CreationInitiale | null;
}

export function MissionFormDialog({
  open,
  onOpenChange,
  mission = null,
  creationInitiale = null,
}: MissionFormDialogProps) {
  const { data: engins } = useEngins();
  const { data: conducteurs } = useConducteurs();
  const creerMission = useCreerMission();
  const modifierMission = useModifierMission();
  const enEdition = mission != null;
  // Avis si cette mission est modifiée ailleurs pendant la saisie (temps réel, 2026-09-29).
  useEditionEnCours("missions", open ? mission?.idMission : undefined);

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
    if (mission) {
      reset({
        motif: mission.motif,
        dateDebutPrevue: mission.dateDebutPrevue.slice(0, 16),
        dateFinPrevue: mission.dateFinPrevue.slice(0, 16),
        idEngin: String(mission.engin.idEngin),
        idConducteur: String(mission.conducteur.idConducteur),
      });
    } else if (creationInitiale) {
      const debut = new Date(creationInitiale.jour);
      debut.setHours(8, 0, 0, 0);
      const fin = new Date(creationInitiale.jour);
      fin.setHours(17, 0, 0, 0);
      reset({
        motif: "",
        dateDebutPrevue: format(debut, "yyyy-MM-dd'T'HH:mm"),
        dateFinPrevue: format(fin, "yyyy-MM-dd'T'HH:mm"),
        idEngin: creationInitiale.contexte === "engin" ? String(creationInitiale.idRessource) : "",
        idConducteur: creationInitiale.contexte === "conducteur" ? String(creationInitiale.idRessource) : "",
      });
    } else {
      reset({ motif: "", dateDebutPrevue: "", dateFinPrevue: "", idEngin: "", idConducteur: "" });
    }
  }, [open, mission, creationInitiale, reset]);

  const onSubmit = async (values: FormValues) => {
    const requete = {
      motif: values.motif,
      dateDebutPrevue: values.dateDebutPrevue,
      dateFinPrevue: values.dateFinPrevue,
      idEngin: Number(values.idEngin),
      idConducteur: Number(values.idConducteur),
    };
    try {
      if (mission) {
        await modifierMission.mutateAsync({ id: mission.idMission, requete });
        toast.success("Mission modifiée");
      } else {
        await creerMission.mutateAsync(requete);
        toast.success("Mission créée");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : enEdition ? "Impossible de modifier la mission" : "Impossible de créer la mission");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{enEdition ? "Modifier la mission" : "Nouvelle mission"}</DialogTitle>
          <DialogDescription>
            {enEdition
              ? "Corrigez les dates, le motif ou l'affectation de cette mission planifiée."
              : "Planifiez une mission pour un véhicule et un conducteur."}
          </DialogDescription>
          <LienAide idPage="guide-planifier-mission" libelle="Comment faire ?" />
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motif">Motif</Label>
            <Textarea id="motif" {...register("motif")} />
            {errors.motif && <p className="text-sm text-destructive">{errors.motif.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebutPrevue">Début prévu</Label>
              <Input id="dateDebutPrevue" type="datetime-local" {...register("dateDebutPrevue")} />
              {errors.dateDebutPrevue && (
                <p className="text-sm text-destructive">{errors.dateDebutPrevue.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFinPrevue">Fin prévue</Label>
              <Input id="dateFinPrevue" type="datetime-local" {...register("dateFinPrevue")} />
              {errors.dateFinPrevue && <p className="text-sm text-destructive">{errors.dateFinPrevue.message}</p>}
            </div>
          </div>
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
              <Label>Conducteur</Label>
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
              {errors.idConducteur && <p className="text-sm text-destructive">{errors.idConducteur.message}</p>}
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
