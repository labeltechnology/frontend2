import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClassementChantiers } from "@/features/chantiers/rentabilite/rentabilite-api";
import {
  classeEcartBudget,
  LIBELLES_POSTE,
  LIBELLES_VERDICT,
  tableauClassement,
  VARIANT_VERDICT,
  verdict,
} from "@/features/chantiers/rentabilite/rentabilite";
import { TarifsCarte } from "@/features/chantiers/rentabilite/TarifsCarte";
import { jourLocal } from "@/features/chantiers/journal/journal-chantier";
import { exporterExcel } from "@/lib/export-excel";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatMontant, formatNombre } from "@/lib/utils";

/**
 * Onglet « Rentabilité » de la page Chantiers (V64) : chantiers démarrés
 * classés par coût du matériel, poste dominant, écart au budget, marge et
 * verdict ; tarifs de refacturation par type.
 */
export function RentabiliteChantiersTab({ gestion }: { gestion: boolean }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useClassementChantiers();
  const [export_, setExport] = useState(false);

  const exporter = async () => {
    if (!data) return;
    setExport(true);
    try {
      await exporterExcel(tableauClassement(data, formatDate(jourLocal(new Date()))));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export impossible");
    } finally {
      setExport(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Chantiers en cours ou terminés, du plus coûteux au moins coûteux (coûts réels à ce jour). La marge compare le refacturable
          au coût réel.
        </p>
        <Button type="button" variant="outline" onClick={exporter} disabled={!data || data.length === 0 || export_}>
          <FileSpreadsheet className="h-4 w-4" />
          Exporter en Excel
        </Button>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Calcul du classement…</p>}
      {isError && <p className="text-sm text-destructive">Impossible de calculer le classement.</p>}
      {data && data.length === 0 && <p className="text-sm text-muted-foreground">Aucun chantier démarré.</p>}
      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chantier</TableHead>
                <TableHead className="text-right">Coût réel</TableHead>
                <TableHead className="text-right">Par jour-véhicule</TableHead>
                <TableHead>Poste dominant</TableHead>
                <TableHead className="text-right">Écart au budget</TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead>Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => {
                const v = verdict(r);
                return (
                  <TableRow key={r.idChantier} className="cursor-pointer" onClick={() => navigate(`/chantiers/${r.idChantier}/fiche`)}>
                    <TableCell>
                      <div className="font-medium">{r.nomChantier}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.typeChantier ?? "Sans type"} · {formatNombre(r.joursVehicules)} jours-véhicule
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(r.coutReel)}</TableCell>
                    <TableCell className="text-right">{formatMontant(r.coutParJourVehicule)}</TableCell>
                    <TableCell>{r.posteDominant ? LIBELLES_POSTE[r.posteDominant] : "—"}</TableCell>
                    <TableCell className={`text-right ${classeEcartBudget(r.ecartBudget)}`}>{formatMontant(r.ecartBudget)}</TableCell>
                    <TableCell className={r.marge < 0 ? "text-right text-destructive" : "text-right"}>
                      {v === "NON_CHIFFRE" ? "—" : formatMontant(r.marge)}
                      {r.tauxMarge != null && <div className="text-xs">{r.tauxMarge} %</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={VARIANT_VERDICT[v]}>{LIBELLES_VERDICT[v]}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <TarifsCarte modifiable={gestion} />
    </div>
  );
}
