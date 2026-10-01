import { useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { ProformaApercuDialog } from "@/features/proforma/ProformaApercuDialog";
import { ProformaFormDialog } from "@/features/proforma/ProformaFormDialog";
import { useFacturesProforma } from "@/features/proforma/api";
import { pluriel } from "@/lib/pluriel";
import { formatDate, formatMontant } from "@/lib/utils";
import type { FactureProforma } from "@/types/proforma";

/**
 * Liste des factures proforma — document libre et indépendant (devis), non
 * lié à un contrat de location existant (choix confirmé avec l'utilisateur).
 * Pas d'action de statut (payer/annuler) : un devis non engageant n'a pas de
 * cycle de vie, à la différence des factures de location/garage.
 */
export function ProformaPage() {
  const { data: proformas, isLoading, isError } = useFacturesProforma();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [aApercu, setAApercu] = useState<FactureProforma | null>(null);

  const columns: DataTableColumn<FactureProforma>[] = [
    { key: "reference", header: "Référence", render: (p) => <span className="font-medium">{p.reference}</span> },
    { key: "client", header: "Client", render: (p) => p.clientNom },
    { key: "dateEmission", header: "Date d'émission", render: (p) => formatDate(p.dateEmission) },
    {
      key: "validite",
      header: "Validité",
      render: (p) => (p.validiteJours != null ? pluriel(p.validiteJours, "jour") : "—"),
    },
    { key: "montantTtc", header: "Total TTC", render: (p) => formatMontant(p.montantTtc) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures pro forma"
        description="Devis non engageants, indépendants des contrats de location — destinataire et lignes saisis librement."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle facture pro forma
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={proformas}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(p) => p.idFactureProforma}
        rowActions={(p) => (
          <div className="flex justify-end">
            <Button variant="outline" size="icon" title="Aperçu" onClick={() => setAApercu(p)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ProformaFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
      <ProformaApercuDialog proforma={aApercu} onOpenChange={(open) => !open && setAApercu(null)} />
    </div>
  );
}
