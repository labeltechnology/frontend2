import { useState } from "react";
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
import { useTerminerContratLocation } from "@/features/location-externe/api";
import { ApiError } from "@/lib/api-client";
import type { ContratLocationExterne } from "@/types/location";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface TerminerContratDialogProps {
  contrat: ContratLocationExterne | null;
  onOpenChange: (open: boolean) => void;
}

export function TerminerContratDialog({ contrat, onOpenChange }: TerminerContratDialogProps) {
  const [dateFinReelle, setDateFinReelle] = useState("");
  const terminer = useTerminerContratLocation();

  const onValider = async () => {
    if (!contrat) return;
    try {
      await terminer.mutateAsync({ id: contrat.idContratLocationExterne, dateFinReelle: dateFinReelle || undefined });
      toast.success("Contrat terminé");
      setDateFinReelle("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Dialog open={!!contrat} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terminer le contrat de location</DialogTitle>
          <DialogDescription>
            {libelleVehicule(contrat?.engin)} — {contrat?.nomSociete}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="dateFinReelle">Date de fin réelle (laisser vide pour retenir la date du jour)</Label>
          <Input
            id="dateFinReelle"
            type="date"
            value={dateFinReelle}
            onChange={(e) => setDateFinReelle(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={onValider} disabled={terminer.isPending}>
            {terminer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Terminer le contrat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
