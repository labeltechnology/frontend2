import { useMemo, useState } from "react";
import { Download, Eye, FileSpreadsheet, Mail, MoreHorizontal, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AbonnementsDialog } from "@/features/rapports/abonnements/AbonnementsDialog";
import { useActionsRapport } from "@/features/rapports/actions-rapport";
import { useRapports } from "@/features/rapports/api";
import { BarreFiltresRapports } from "@/features/rapports/BarreFiltresRapports";
import { definitionRapport } from "@/features/rapports/catalogue";
import {
  compterParFamille,
  filtrerRapports,
  FILTRES_RAPPORTS_DEFAUT,
  libellePeriode,
  trierRapports,
  type FiltresRapports,
} from "@/features/rapports/liste-rapports";
import { ICONES_RAPPORT, TEINTE_FAMILLE } from "@/features/rapports/presentation-rapport";
import { RapportApercuDialog } from "@/features/rapports/RapportApercuDialog";
import { RapportFormDialog } from "@/features/rapports/RapportFormDialog";
import { cn, formatDateTime } from "@/lib/utils";
import type { Rapport } from "@/types/rapport";

/**
 * Page Rapports (refonte du 2026-09-28) : rapports du plus récent au plus
 * ancien, avec titre en clair, cible (véhicule, conducteur, chantier) et
 * période ; recherche et filtres ; aperçu au clic ; téléchargement PDF/Excel
 * et régénération depuis le menu de la ligne. La génération passe par le
 * catalogue en cartes (RapportFormDialog) et ouvre directement l'aperçu.
 * « Recevoir par e-mail » (2026-09-29) : abonnements hebdomadaires ou
 * mensuels (AbonnementsDialog).
 */
export function RapportsPage() {
  const { data: rapports, isLoading, isError } = useRapports();
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [abonnementsOuvert, setAbonnementsOuvert] = useState(false);
  const [apercu, setApercu] = useState<Rapport | null>(null);
  const [filtres, setFiltres] = useState<FiltresRapports>(FILTRES_RAPPORTS_DEFAUT);
  const actions = useActionsRapport();

  const tous = useMemo(() => trierRapports(rapports ?? []), [rapports]);
  const visibles = useMemo(() => filtrerRapports(tous, filtres, new Date()), [tous, filtres]);
  const compte = useMemo(() => compterParFamille(tous), [tous]);

  const regenerer = async (r: Rapport) => {
    const nouveau = await actions.regenerer(r);
    if (nouveau) setApercu(nouveau);
  };

  const colonnes: DataTableColumn<Rapport>[] = [
    {
      key: "rapport",
      header: "Rapport",
      render: (r) => {
        const def = definitionRapport(r.type);
        const Icone = ICONES_RAPPORT[def.icone];
        return (
          <div className="flex items-center gap-3">
            <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", TEINTE_FAMILLE[def.famille])}>
              <Icone className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-medium">{def.titre}</p>
              <p className="truncate text-xs text-muted-foreground">{r.libelleCible ?? "Tout le parc"}</p>
            </div>
          </div>
        );
      },
    },
    { key: "periode", header: "Période", render: (r) => <span className="whitespace-nowrap text-sm">{libellePeriode(r)}</span> },
    {
      key: "genere",
      header: "Généré le",
      render: (r) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDateTime(r.dateGeneration)} <span className="text-xs">· n° {r.idRapport}</span>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Synthèses chiffrées du parc à consulter, télécharger en PDF ou Excel, et régénérer à tout moment."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAbonnementsOuvert(true)}>
              <Mail className="h-4 w-4" />
              Recevoir par e-mail
            </Button>
            <Button onClick={() => setFormulaireOuvert(true)}>
              <Plus className="h-4 w-4" />
              Nouveau rapport
            </Button>
          </div>
        }
      />

      <BarreFiltresRapports
        filtres={filtres}
        onChange={setFiltres}
        compteParFamille={compte}
        resultat={visibles.length}
        total={tous.length}
      />

      <DataTable
        columns={colonnes}
        data={visibles}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(r) => r.idRapport}
        onRowClick={setApercu}
        emptyMessage={tous.length === 0 ? "Aucun rapport pour l'instant : cliquez sur « Nouveau rapport »." : "Aucun rapport ne correspond aux filtres."}
        rowActions={(r) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setApercu(r)}>
              <Eye className="h-4 w-4" />
              Aperçu
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Autres actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => actions.telechargerPdf(r)}>
                  <Download className="h-4 w-4" />
                  Télécharger le PDF
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.telechargerExcel(r)}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Télécharger l'Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => regenerer(r)}>
                  <RefreshCw className="h-4 w-4" />
                  Régénérer (mêmes paramètres)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      />

      <RapportFormDialog open={formulaireOuvert} onOpenChange={setFormulaireOuvert} onGenere={setApercu} />
      <AbonnementsDialog open={abonnementsOuvert} onOpenChange={setAbonnementsOuvert} />
      <RapportApercuDialog rapport={apercu} onOpenChange={(open) => !open && setApercu(null)} onRegenere={setApercu} />
    </div>
  );
}
