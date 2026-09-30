import { useState } from "react";
import { AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCoutsChantier } from "@/features/chantiers/suivi-api";
import { LIBELLES_POSTES, partsPostes, tableauCoutsChantier, type PosteCout } from "@/features/chantiers/suivi/couts-chantier";
import { CarteRentabilite } from "@/features/chantiers/rentabilite/CarteRentabilite";
import { exporterExcel } from "@/lib/export-excel";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatMontant, formatNombre } from "@/lib/utils";

const POSTES: PosteCout[] = ["carburant", "maintenance", "coutsFixes"];

/**
 * Onglet « Coûts » de la fiche chantier (2026-09-29) : coûts réels à date,
 * par véhicule rattaché (carburant, maintenance, coûts fixes au prorata),
 * avec export Excel. Pas de prévision : seulement ce qui est déjà dépensé.
 */
export function OngletCoutsChantier({ idChantier, peutGerer = false }: { idChantier: number; peutGerer?: boolean }) {
  const { data: couts, isLoading, isError } = useCoutsChantier(idChantier);
  const [exportEnCours, setExportEnCours] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Calcul des coûts…</p>;
  if (isError || !couts) return <p className="text-sm text-destructive">Impossible de calculer les coûts du chantier.</p>;

  const parts = partsPostes(couts);
  const exporter = async () => {
    setExportEnCours(true);
    try {
      await exporterExcel(tableauCoutsChantier(couts));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export impossible");
    } finally {
      setExportEnCours(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Coûts réels au {formatDate(couts.calculeLe)}, sur la période de chaque véhicule dans le chantier.
        </p>
        <Button type="button" variant="outline" onClick={exporter} disabled={exportEnCours || couts.vehicules.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />
          {exportEnCours ? "Export…" : "Exporter en Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{formatMontant(couts.total)}</p>
          <p className="text-xs text-muted-foreground">
            {formatMontant(couts.coutParJourVehicule)} par jour-véhicule ({couts.joursVehicules} j)
          </p>
        </div>
        {POSTES.map((poste) => (
          <div key={poste} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{LIBELLES_POSTES[poste]}</p>
            <p className="text-lg font-semibold">{formatMontant(couts[poste])}</p>
            <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden>
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${parts[poste]}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{parts[poste]} % du total</p>
          </div>
        ))}
      </div>

      {(couts.incidents ?? 0) > 0 && (
        <p className="text-sm text-muted-foreground">
          {couts.incidents} incident(s) rattaché(s) au chantier, coût estimé {formatMontant(couts.coutIncidentsEstime ?? 0)} (hors
          total : la réparation est comptée en maintenance).
        </p>
      )}

      <CarteRentabilite idChantier={idChantier} peutGerer={peutGerer} />

      {couts.coutsFixesManquants.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-badge-warningFg/40 bg-badge-warningBg p-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-badge-warningFg" />
          <span>
            Coûts fixes non renseignés pour {couts.coutsFixesManquants.join(", ")} : le total est sous-estimé.
          </span>
        </p>
      )}

      {couts.vehicules.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun véhicule n'a encore travaillé sur ce chantier.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="text-right">Carburant</TableHead>
                <TableHead className="text-right">Maintenance</TableHead>
                <TableHead className="text-right">Coûts fixes</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Heures</TableHead>
                <TableHead className="text-right">Coût / heure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couts.vehicules.map((l) => (
                <TableRow key={l.idEngin}>
                  <TableCell>
                    <div className="font-medium">{l.vehicule}</div>
                    {l.typeEngin && <div className="text-xs text-muted-foreground">{l.typeEngin}</div>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(l.debut)} → {formatDate(l.fin)} <span className="text-muted-foreground">({l.jours} j)</span>
                  </TableCell>
                  <TableCell className="text-right">{formatNombre(l.litres, 1)}</TableCell>
                  <TableCell className="text-right">{formatMontant(l.carburant)}</TableCell>
                  <TableCell className="text-right">{formatMontant(l.maintenance)}</TableCell>
                  <TableCell className="text-right">{formatMontant(l.coutsFixes)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMontant(l.total)}</TableCell>
                  <TableCell className="text-right">{l.heuresJournal > 0 ? formatNombre(l.heuresJournal, 1) : "—"}</TableCell>
                  <TableCell className="text-right">{formatMontant(l.coutParHeure)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">Total</TableCell>
                <TableCell className="text-right">{formatMontant(couts.carburant)}</TableCell>
                <TableCell className="text-right">{formatMontant(couts.maintenance)}</TableCell>
                <TableCell className="text-right">{formatMontant(couts.coutsFixes)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMontant(couts.total)}</TableCell>
                <TableCell className="text-right">{couts.heuresJournal > 0 ? formatNombre(couts.heuresJournal, 1) : "—"}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Les heures viennent du journal de chantier ; le coût par heure n'apparaît que pour les véhicules dont les heures sont saisies.
      </p>
    </div>
  );
}
