import { useState } from "react";
import { CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import {
  useAnnulerFactureGarage,
  useCreerFactureGarage,
  useFacturesGarage,
  useMarquerFactureGaragePayee,
} from "@/features/factures-garage/api";
import { useMaintenances } from "@/features/maintenance/api";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatMontant } from "@/lib/utils";
import type { GarageExterne } from "@/types/garage";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface FacturesGarageDialogProps {
  garage: GarageExterne | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Facturation des interventions d'un garage externe (règles validées avec
 * l'utilisateur, à la différence de la location externe qui facture une
 * période) :
 * <ul>
 *   <li>une facture correspond à UNE seule intervention de maintenance déjà
 *       terminée</li>
 *   <li>le montant reprend directement le coût total déjà calculé de cette
 *       intervention (règle 9.8, {@code Maintenance.coutTotal}) — aucune
 *       saisie manuelle</li>
 * </ul>
 * Les interventions déjà facturées sont retirées de la liste proposée en
 * comparant aux factures déjà émises pour ce garage (même contrainte
 * appliquée côté backend par {@code FactureGarageService.creer}).
 */
export function FacturesGarageDialog({ garage, onOpenChange }: FacturesGarageDialogProps) {
  const idGarage = garage?.idGarageExterne;
  const { data: factures, isLoading: chargementFactures } = useFacturesGarage(idGarage);
  const { data: maintenances } = useMaintenances();
  const creer = useCreerFactureGarage();
  const payer = useMarquerFactureGaragePayee();
  const annuler = useAnnulerFactureGarage();

  const [idMaintenanceChoisie, setIdMaintenanceChoisie] = useState<string>("");

  const idsMaintenancesFacturees = new Set((factures ?? []).map((f) => f.maintenance.idMaintenance));
  const maintenancesFacturables = (maintenances ?? []).filter(
    (m) =>
      m.idGarageExterne === idGarage &&
      m.statut === "TERMINEE" &&
      !idsMaintenancesFacturees.has(m.idMaintenance),
  );

  const onCreer = async () => {
    if (!idMaintenanceChoisie) {
      toast.error("Choisissez une intervention à facturer");
      return;
    }
    try {
      await creer.mutateAsync({ idMaintenance: Number(idMaintenanceChoisie) });
      setIdMaintenanceChoisie("");
      toast.success("Facture émise");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Émission de la facture impossible");
    }
  };

  const onPayer = async (id: number) => {
    try {
      await payer.mutateAsync({ id });
      toast.success("Facture marquée comme payée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onAnnuler = async (id: number) => {
    try {
      await annuler.mutateAsync(id);
      toast.success("Facture annulée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  return (
    <Dialog open={!!garage} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Factures du garage</DialogTitle>
          <DialogDescription>{garage?.nom}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[300px] flex-1 space-y-2">
            <Select value={idMaintenanceChoisie} onValueChange={setIdMaintenanceChoisie}>
              <SelectTrigger>
                <SelectValue placeholder="Intervention terminée à facturer" />
              </SelectTrigger>
              <SelectContent>
                {maintenancesFacturables.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Aucune intervention terminée à facturer pour ce garage.
                  </div>
                )}
                {maintenancesFacturables.map((m) => (
                  <SelectItem key={m.idMaintenance} value={String(m.idMaintenance)}>
                    {libelleVehicule(m.engin)} — terminée le {formatDate(m.dateFin?.slice(0, 10))} —{" "}
                    {formatMontant(m.coutTotal)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onCreer} disabled={creer.isPending || !idMaintenanceChoisie}>
            {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Émettre la facture
          </Button>
        </div>

        <div className="max-h-[40vh] space-y-2 overflow-auto">
          {chargementFactures && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!chargementFactures && (!factures || factures.length === 0) && (
            <p className="text-sm text-muted-foreground">Aucune facture émise pour ce garage.</p>
          )}
          {factures?.map((facture) => (
            <div
              key={facture.idFactureGarage}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="space-y-0.5 text-sm">
                <div className="font-medium">{facture.reference}</div>
                <div className="text-muted-foreground">
                  {libelleVehicule(facture.maintenance.engin)} — terminée le{" "}
                  {formatDate(facture.maintenance.dateFin?.slice(0, 10))} — {formatMontant(facture.montant)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatutBadge statut={facture.statut} />
                {facture.statut === "EMISE" && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Marquer comme payée"
                      disabled={payer.isPending}
                      onClick={() => onPayer(facture.idFactureGarage)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Annuler la facture"
                      disabled={annuler.isPending}
                      onClick={() => onAnnuler(facture.idFactureGarage)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
