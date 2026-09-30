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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import {
  useAnnulerFactureLocationEntrante,
  useCreerFactureLocationEntrante,
  useFacturesLocationEntrante,
  useMarquerFactureLocationEntrantePayee,
} from "@/features/factures-location-entrante/api";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatMontant } from "@/lib/utils";
import type { ContratLocationEntrante } from "@/types/location-entrante";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface FacturesDialogProps {
  contrat: ContratLocationEntrante | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Factures REÇUES du prestataire pour un contrat de location entrante :
 * enregistrement manuel pour une période choisie, montant dû = tarif
 * journalier du contrat × nombre de jours, tarif figé sur chaque facture à
 * l'enregistrement (voir FactureLocationEntrante côté backend).
 *
 * Délibérément sans bouton « Aperçu » (pas d'export PDF pour ce type de
 * facture — même principe que FacturesGarageDialog) : il ne s'agit pas d'un
 * document que l'entreprise émet, mais de l'enregistrement d'une dépense.
 */
export function FacturesDialog({ contrat, onOpenChange }: FacturesDialogProps) {
  const idContrat = contrat?.idContratLocationEntrante;
  const { data: factures, isLoading } = useFacturesLocationEntrante(idContrat);
  const creer = useCreerFactureLocationEntrante();
  const payer = useMarquerFactureLocationEntrantePayee();
  const annuler = useAnnulerFactureLocationEntrante();

  const [dateDebutPeriode, setDateDebutPeriode] = useState("");
  const [dateFinPeriode, setDateFinPeriode] = useState("");

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
      toast.success("Facture enregistrée");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Enregistrement de la facture impossible");
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
    <Dialog open={!!contrat} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Factures reçues du prestataire</DialogTitle>
          <DialogDescription>
            {libelleVehicule(contrat?.engin)} — prestataire {contrat?.nomPrestataire}
            {contrat?.tarifJournalier != null && ` — tarif journalier : ${formatMontant(contrat.tarifJournalier)}`}
          </DialogDescription>
        </DialogHeader>

        {sansTarif && (
          <p className="rounded-md border border-warning bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
            Ce contrat n'a pas de tarif journalier défini : fixe-le d'abord (action « Tarif journalier ») avant
            d'enregistrer une facture.
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
            Enregistrer la facture
          </Button>
        </div>

        <div className="max-h-[40vh] space-y-2 overflow-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!isLoading && (!factures || factures.length === 0) && (
            <p className="text-sm text-muted-foreground">Aucune facture enregistrée pour ce contrat.</p>
          )}
          {factures?.map((facture) => (
            <div
              key={facture.idFactureLocationEntrante}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="space-y-0.5 text-sm">
                <div className="font-medium">{facture.reference}</div>
                <div className="text-muted-foreground">
                  {formatDate(facture.dateDebutPeriode)} → {formatDate(facture.dateFinPeriode)} ({facture.nombreJours}{" "}
                  jour{facture.nombreJours > 1 ? "s" : ""}) — {formatMontant(facture.montant)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatutBadge statut={facture.statut} />
                {facture.statut === "EMISE" && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Marquer payée"
                      disabled={payer.isPending}
                      onClick={() => onPayer(facture.idFactureLocationEntrante)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Annuler la facture"
                      disabled={annuler.isPending}
                      onClick={() => onAnnuler(facture.idFactureLocationEntrante)}
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
