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
import { ContratLocationEntranteFormDialog } from "@/features/location-entrante/ContratLocationEntranteFormDialog";
import { TarifDialog } from "@/features/location-entrante/TarifDialog";
import { TerminerContratDialog } from "@/features/location-entrante/TerminerContratDialog";
import { useContratsLocationEntrante } from "@/features/location-entrante/api";
import { FacturesDialog } from "@/features/factures-location-entrante/FacturesDialog";
import { formatDate, formatMontant } from "@/lib/utils";
import type { ContratLocationEntrante } from "@/types/location-entrante";
import { libelleVehicule } from "@/lib/vehicule";

/**
 * Sens inverse du module « Locations externes » (features/location-externe/) :
 * ici l'entreprise loue un engin CHEZ un prestataire externe pour son propre
 * usage, quand son parc n'a pas d'engin disponible du type requis — choix
 * confirmé avec l'utilisateur. L'engin loué est un Engin normal du parc
 * (créé au préalable via l'écran Engins), ce contrat le rattache seulement
 * à un prestataire et une période.
 */
export function LocationEntrantePage() {
  const { data: contrats, isLoading, isError } = useContratsLocationEntrante();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [aTerminer, setATerminer] = useState<ContratLocationEntrante | null>(null);
  const [aTarifer, setATarifer] = useState<ContratLocationEntrante | null>(null);
  const [aFacturer, setAFacturer] = useState<ContratLocationEntrante | null>(null);
  // Reprend la version la plus fraîche du contrat : les mutations (tarif, facturation) invalident la liste.
  const contratActuel = (contrat: ContratLocationEntrante | null) =>
    contrat
      ? contrats?.find((c) => c.idContratLocationEntrante === contrat.idContratLocationEntrante) ?? contrat
      : null;

  const columns: DataTableColumn<ContratLocationEntrante>[] = [
    { key: "engin", header: "Véhicule", render: (c) => <span className="font-medium">{libelleVehicule(c.engin)}</span> },
    { key: "prestataire", header: "Prestataire", render: (c) => c.nomPrestataire },
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
        title="Locations entrantes"
        description="Véhicules loués chez un prestataire externe pour l'usage de l'entreprise, lorsque le parc n'en dispose pas."
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
        getRowKey={(c) => c.idContratLocationEntrante}
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

      <ContratLocationEntranteFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <TerminerContratDialog contrat={aTerminer} onOpenChange={(open) => !open && setATerminer(null)} />
      <TarifDialog contrat={contratActuel(aTarifer)} onOpenChange={(open) => !open && setATarifer(null)} />
      <FacturesDialog contrat={contratActuel(aFacturer)} onOpenChange={(open) => !open && setAFacturer(null)} />
    </div>
  );
}
