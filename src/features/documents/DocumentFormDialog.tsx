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
import { useConducteurs } from "@/features/conducteurs/api";
import { useEngins } from "@/features/engins/api";
import { useCreerDocument } from "@/features/documents/api";
import { ApiError } from "@/lib/api-client";
import type { TypeDocument } from "@/types/document";
import { LIBELLES_TYPE_DOCUMENT, TYPES_DOCUMENT } from "@/features/documents/libelles";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

const schema = z.object({
  type: z.enum([
    "CARTE_GRISE",
    "ASSURANCE",
    "VISITE_TECHNIQUE",
    "PERMIS_CONDUIRE",
    "AUTRE",
    "CONFORMITE_FISCALE",
    "LICENCE_TRANSPORT",
    "CARTE_CARBURANT",
  ]),
  idEngin: z.string().optional(),
  idConducteur: z.string().optional(),
  numeroReference: z.string().optional(),
  dateDebut: z.string().optional(),
  dateExpiration: z.string().optional(),
  cheminFichier: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentFormDialog({ open, onOpenChange }: DocumentFormDialogProps) {
  const { data: engins } = useEngins();
  const { data: conducteurs } = useConducteurs();
  const creerDocument = useCreerDocument();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "CARTE_GRISE" } });

  useEffect(() => {
    if (!open) reset({ type: "CARTE_GRISE" });
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await creerDocument.mutateAsync({
        type: values.type,
        idEngin: values.idEngin ? Number(values.idEngin) : undefined,
        idConducteur: values.idConducteur ? Number(values.idConducteur) : undefined,
        numeroReference: values.numeroReference || undefined,
        dateDebut: values.dateDebut || undefined,
        dateExpiration: values.dateExpiration || undefined,
        cheminFichier: values.cheminFichier || undefined,
      });
      toast.success("Document créé");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible de créer le document");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau document</DialogTitle>
          <DialogDescription>Rattaché à un véhicule ou à un conducteur (au choix).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v as TypeDocument)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENT.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LIBELLES_TYPE_DOCUMENT[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Véhicule (facultatif)</Label>
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
            <Label htmlFor="numeroReference">Numéro de référence</Label>
            <Input id="numeroReference" {...register("numeroReference")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input id="dateDebut" type="date" {...register("dateDebut")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateExpiration">Date d'expiration</Label>
              <Input id="dateExpiration" type="date" {...register("dateExpiration")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cheminFichier">Chemin du fichier</Label>
            <Input id="cheminFichier" {...register("cheminFichier")} />
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
