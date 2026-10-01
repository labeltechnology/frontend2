import { useState } from "react";
import { CheckCircle2, Eye, Loader2, Plus, XCircle } from "lucide-react";
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
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { FactureApercuDialog } from "@/features/factures-location/FactureApercuDialog";
import {
  useAnnulerFactureLocation,
  useCreerFactureLocation,
  useFacturesLocation,
  useMarquerFacturePayee,
} from "@/features/factures-location/api";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatMontant } from "@/lib/utils";
import type { ContratLocationExterne, FactureLocation } from "@/types/location";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface FacturesDialogProps {
  contrat: ContratLocationExterne | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Facturation d'un contrat de location externe (règles validées avec
 * l'utilisateur) : création manuelle pour une période choisie, montant =
 * tarif journalier du contrat × nombre de jours, tarif figé sur chaque
 * facture à l'émission (voir FactureLocation côté backend).
 */
export function FacturesDialog({ contrat, onOpenChange }: FacturesDialogProps) {
  const idContrat = contrat?.idContratLocationExterne;
  const { data: factures, isLoading } = useFacturesLocation(idContrat);
  const creer = useCreerFactureLocation();
  const payer = useMarquerFacturePayee();
  const annuler = useAnnulerFactureLocation();

  const [dateDebutPeriode, setDateDebutPeriode] = useState("");
  const [dateFinPeriode, setDateFinPeriode] = useState("");
  const [aApercu, setAApercu] = useState<FactureLocation | null>(null);

  const sansTarif = contrat != null && contrat.tarifJournalier == null;

  const onCreer = async () => {
    if (!idContrat || !dateDebutPeriode || !dateFinPeriode) {
      toast.error("Période incomplète");
      return;
    }
    try {
      await creer.mutateAsync({ idContrat, dateDebutPeriode, dateFinPeriode });
      setDateDebutPeriode("");
      setDateFinPeriode("");
      toast.success("Facture émise");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Émission de la facture impossible");
    }
  };

  const onPayer = async (id: number) => {
    try {
      await payer.mutateAsync({ id });
      toast.success("Facture marquée payée");
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
    <>
      <Dialog open={!!contrat} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Factures de location</DialogTitle>
            <DialogDescription>
              {libelleVehicule(contrat?.engin)} — société {contrat?.nomSociete}
              {contrat?.tarifJournalier != null && ` — tarif journalier : ${formatMontant(contrat.tarifJournalier)}`}
            </DialogDescription>
          </DialogHeader>

          {sansTarif && (
            <p className="rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
              Ce contrat n'a pas de tarif journalier défini : fixez-le d'abord (action « Tarif journalier ») avant
              d'émettre une facture.
            </p>
          )}

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebutPeriode">Début de la période</Label>
              <Input
                id="dateDebutPeriode"
                type="date"
                value={dateDebutPeriode}
                onChange={(e) => setDateDebutPeriode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFinPeriode">Fin de la période</Label>
              <Input
                id="dateFinPeriode"
                type="date"
                value={dateFinPeriode}
                onChange={(e) => setDateFinPeriode(e.target.value)}
              />
            </div>
            <Button onClick={onCreer} disabled={creer.isPending || sansTarif}>
              {creer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Émettre la facture
            </Button>
          </div>

          <div className="max-h-[40vh] space-y-2 overflow-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!isLoading && (!factures || factures.length === 0) && (
              <p className="text-sm text-muted-foreground">Aucune facture émise pour ce contrat.</p>
            )}
            {factures?.map((facture) => (
              <div
                key={facture.idFactureLocation}
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="space-y-0.5 text-sm">
                  <div className="font-medium">{facture.reference}</div>
                  <div className="text-muted-foreground">
                    {formatDate(facture.dateDebutPeriode)} → {formatDate(facture.dateFinPeriode)} ({facture.nombreJours}{" "}
                    jour{facture.nombreJours > 1 ? "s" : ""}) — {formatMontant(facture.montant)} HT
                    {facture.tauxTvaApplique > 0 && (
                      <>
                        {" "}
                        + TVA {facture.tauxTvaApplique}% ={" "}
                        <span className="font-medium text-foreground">{formatMontant(facture.montantTtc)} TTC</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatutBadge statut={facture.statut} />
                  <Button
                    variant="outline"
                    size="icon"
                    title="Aperçu de la facture"
                    onClick={() => setAApercu(facture)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {facture.statut === "EMISE" && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Marquer payée"
                        disabled={payer.isPending}
                        onClick={() => onPayer(facture.idFactureLocation)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Annuler la facture"
                        disabled={annuler.isPending}
                        onClick={() => onAnnuler(facture.idFactureLocation)}
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

      <FactureApercuDialog facture={aApercu} onOpenChange={(open) => !open && setAApercu(null)} />
    </>
  );
}
