import { useEffect, useState } from "react";
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
import { useEnregistrerIntervention } from "@/features/entretien/api";
import { ApiError } from "@/lib/api-client";
import { formatNombre, normaliserNombre } from "@/lib/utils";
import type { EcheanceEntretien } from "@/types/entretien";
import { toast } from "sonner";

interface InterventionEntretienDialogProps {
  idEngin: number;
  /** Compteur actuel de l'engin (km ou h), proposé par défaut. */
  compteurActuel: number | null;
  echeance: EcheanceEntretien | null;
  onOpenChange: (open: boolean) => void;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * « Intervention effectuée » sur un poste (vidange faite, pneus contrôlés...) :
 * le backend enregistre la date et le compteur, puis recalcule la prochaine
 * échéance. Mêmes contrôles côté serveur (date non future, compteur ≤
 * compteur actuel de l'engin, pas antérieur au dernier relevé).
 */
export function InterventionEntretienDialog({ idEngin, compteurActuel, echeance, onOpenChange }: InterventionEntretienDialogProps) {
  const enregistrer = useEnregistrerIntervention(idEngin);
  const [date, setDate] = useState(aujourdhui());
  const [compteur, setCompteur] = useState("");
  const [observation, setObservation] = useState("");

  useEffect(() => {
    if (echeance) {
      setDate(aujourdhui());
      setCompteur(compteurActuel != null ? String(compteurActuel) : "");
      setObservation("");
    }
  }, [echeance, compteurActuel]);

  const onValider = async () => {
    if (!echeance) return;
    const texteCompteur = normaliserNombre(compteur);
    const valeurCompteur = texteCompteur ? Number(texteCompteur) : undefined;
    if (valeurCompteur !== undefined && (!Number.isFinite(valeurCompteur) || valeurCompteur < 0)) {
      toast.error("Compteur invalide");
      return;
    }
    try {
      await enregistrer.mutateAsync({
        idPosteEntretien: echeance.idPosteEntretien,
        requete: { dateIntervention: date, compteur: valeurCompteur, observation: observation.trim() || undefined },
      });
      toast.success(`« ${echeance.libelle} » enregistré — échéance recalculée`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement impossible");
    }
  };

  const unite = echeance?.uniteCompteur ?? "km";
  return (
    <Dialog open={echeance !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Intervention effectuée</DialogTitle>
          <DialogDescription>
            {echeance?.libelle}
            {compteurActuel != null && ` — compteur actuel du véhicule : ${formatNombre(compteurActuel)} ${unite}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="intervention-date">Date</Label>
            <Input id="intervention-date" type="date" max={aujourdhui()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intervention-compteur">{unite === "h" ? "Heures moteur" : "Kilométrage"}</Label>
            <Input id="intervention-compteur" inputMode="decimal" value={compteur} onChange={(e) => setCompteur(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="intervention-observation">Observations sur l'entretien</Label>
          <Input id="intervention-observation" maxLength={500} value={observation} onChange={(e) => setObservation(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onValider} disabled={!date || enregistrer.isPending}>
            {enregistrer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
