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
import { useDefinirTarifContratEntrante } from "@/features/location-entrante/api";
import { ApiError } from "@/lib/api-client";
import type { ContratLocationEntrante } from "@/types/location-entrante";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface TarifDialogProps {
  contrat: ContratLocationEntrante | null;
  onOpenChange: (open: boolean) => void;
}

/** Préalable à la facturation : montant dû au prestataire = tarif journalier × nombre de jours. */
export function TarifDialog({ contrat, onOpenChange }: TarifDialogProps) {
  const [valeur, setValeur] = useState("");
  const mutation = useDefinirTarifContratEntrante();

  useEffect(() => {
    setValeur(contrat?.tarifJournalier != null ? String(contrat.tarifJournalier) : "");
  }, [contrat]);

  const onSubmit = async () => {
    if (!contrat) return;
    const nombre = Number(valeur);
    if (!Number.isFinite(nombre) || nombre <= 0) {
      toast.error("Tarif journalier invalide");
      return;
    }
    try {
      await mutation.mutateAsync({ id: contrat.idContratLocationEntrante, tarifJournalier: nombre });
      toast.success("Tarif journalier mis à jour");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Mise à jour impossible");
    }
  };

  return (
    <Dialog open={!!contrat} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tarif journalier</DialogTitle>
          <DialogDescription>
            {libelleVehicule(contrat?.engin)} — prestataire {contrat?.nomPrestataire}. Utilisé pour calculer le montant des
            factures reçues (tarif × nombre de jours de la période facturée).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="tarifJournalier">Tarif journalier</Label>
          <Input
            id="tarifJournalier"
            type="number"
            min={0}
            step="0.01"
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
