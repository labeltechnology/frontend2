import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { ContratLocationFormDialog } from "@/features/location-externe/ContratLocationFormDialog";
import { TarifDialog } from "@/features/location-externe/TarifDialog";
import { TerminerContratDialog } from "@/features/location-externe/TerminerContratDialog";
import { useContratsLocationExterne } from "@/features/location-externe/api";
import { FacturesDialog } from "@/features/factures-location/FacturesDialog";
import { formatDate, formatMontant } from "@/lib/utils";
import type { ContratLocationExterne } from "@/types/location";
import { libelleVehicule } from "@/lib/vehicule";

export function LocationExternePage() {
  const { data: contrats, isLoading, isError } = useContratsLocationExterne();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [aTerminer, setATerminer] = useState<ContratLocationExterne | null>(null);
  const [aTarifer, setATarifer] = useState<ContratLocationExterne | null>(null);
  const [aFacturer, setAFacturer] = useState<ContratLocationExterne | null>(null);
  // Reprend la version la plus fraîche du contrat : les mutations (tarif, facturation) invalident la liste.
  const contratActuel = (contrat: ContratLocationExterne | null) =>
    contrat ? contrats?.find((c) => c.idContratLocationExterne === contrat.idContratLocationExterne) ?? contrat : null;

  const columns: DataTableColumn<ContratLocationExterne>[] = [
    { key: "engin", header: "Véhicule", render: (c) => <span className="font-medium">{libelleVehicule(c.engin)}</span> },
    { key: "societe", header: "Société locataire", render: (c) => c.nomSociete },
    { key: "contact", header: "Contact", render: (c) => c.personneContact ?? c.telephone ?? "—" },
    { key: "reference", header: "Référence", render: (c) => c.referenceContrat ?? "—" },
    { key: "debut", header: "Début", render: (c) => formatDate(c.dateDebut) },
    { key: "finPrevue", header: "Fin prévue", render: (c) => formatDate(c.dateFinPrevue) },
    { key: "finReelle", header: "Fin réelle", render: (c) => formatDate(c.dateFinReelle) },
    { key: "tarifJournalier", header: "Tarif journalier", render: (c) => formatMontant(c.tarifJournalier) },
    { key: "statut", header: "Statut", render: (c) => <StatutBadge statut={c.statut} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations externes"
        description="Véhicules de l'entreprise mis à disposition d'une société externe sous contrat."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouveau contrat
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={contrats}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(c) => c.idContratLocationExterne}
        rowActions={(contrat) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setATarifer(contrat)}>Tarif journalier</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAFacturer(contrat)}>Factures</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={contrat.statut !== "ACTIF"} onSelect={() => setATerminer(contrat)}>
                Terminer le contrat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <ContratLocationFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <TerminerContratDialog contrat={aTerminer} onOpenChange={(open) => !open && setATerminer(null)} />
      <TarifDialog contrat={contratActuel(aTarifer)} onOpenChange={(open) => !open && setATarifer(null)} />
      <FacturesDialog contrat={contratActuel(aFacturer)} onOpenChange={(open) => !open && setAFacturer(null)} />
    </div>
  );
}
