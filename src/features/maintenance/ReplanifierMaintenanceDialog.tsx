import { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
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
import { debutAujourdhui, estJourPasse, versChampDateHeure } from "@/features/maintenance/dates-maintenance";
import { objetMaintenance } from "@/features/maintenance/objet-maintenance";
import { useReplanifierMaintenance } from "@/features/maintenance/replanifier-api";
import { ApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { libelleVehicule } from "@/lib/vehicule";
import type { Maintenance } from "@/types/maintenance";
import { toast } from "sonner";

/**
 * « Replanifier » (2026-09-28) : change ou retire la date prévue d'une
 * maintenance planifiée. Motif facultatif, inscrit au journal d'audit avec
 * l'ancienne et la nouvelle date. Le serveur refuse un jour passé.
 */
export function ReplanifierMaintenanceDialog({ maintenance, onFermer }: { maintenance: Maintenance | null; onFermer: () => void }) {
  const replanifier = useReplanifierMaintenance();
  const [date, setDate] = useState("");
  const [motif, setMotif] = useState("");

  useEffect(() => {
    if (maintenance) {
      setDate(versChampDateHeure(maintenance.datePrevue));
      setMotif("");
    }
  }, [maintenance]);

  if (!maintenance) return null;

  const actuelle = versChampDateHeure(maintenance.datePrevue);
  const passe = estJourPasse(date);
  const inchange = date === actuelle;

  const enregistrer = async (nouvelle: string | null) => {
    try {
      await replanifier.mutateAsync({
        id: maintenance.idMaintenance,
        requete: { datePrevue: nouvelle, motif: motif.trim() || undefined },
      });
      toast.success(nouvelle ? `Maintenance replanifiée au ${formatDateTime(nouvelle)}` : "Date prévue retirée");
      onFermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Replanification impossible");
    }
  };

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" aria-hidden />
            Replanifier la maintenance
          </DialogTitle>
          <DialogDescription>
            {libelleVehicule(maintenance.engin)}
            {objetMaintenance(maintenance) && ` — ${objetMaintenance(maintenance)}`}
            <span className="block">
              Date prévue actuelle : {maintenance.datePrevue ? formatDateTime(maintenance.datePrevue) : "aucune"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="replanifier-date">Nouvelle date prévue</Label>
            <Input
              id="replanifier-date"
              type="datetime-local"
              min={debutAujourdhui()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={passe}
            />
            {passe && <p className="text-sm text-destructive">La date ne peut pas être dans le passé.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="replanifier-motif">Motif (facultatif)</Label>
            <Textarea
              id="replanifier-motif"
              value={motif}
              maxLength={255}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex. : pièce en commande, garage complet, véhicule en mission…"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {maintenance.datePrevue && (
            <Button variant="ghost" className="sm:mr-auto" onClick={() => enregistrer(null)} disabled={replanifier.isPending}>
              Retirer la date
            </Button>
          )}
          <Button variant="outline" onClick={onFermer} disabled={replanifier.isPending}>
            Annuler
          </Button>
          <Button onClick={() => enregistrer(date)} disabled={!date || passe || inchange || replanifier.isPending}>
            {replanifier.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Replanifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
