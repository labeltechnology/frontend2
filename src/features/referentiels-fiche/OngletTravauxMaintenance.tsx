import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { useChangerActivationTravailMaintenance, useTravauxMaintenance } from "@/features/maintenance/travaux-api";
import { LIBELLES_PORTEE } from "@/features/referentiels-fiche/libelles";
import { TravailMaintenanceFormDialog } from "@/features/referentiels-fiche/TravailMaintenanceFormDialog";
import { ApiError } from "@/lib/api-client";
import type { TravailMaintenance } from "@/types/travail-maintenance";

/**
 * Onglet « Travaux de maintenance » de « Listes de la fiche » (V45,
 * 2026-09-25) : travaux proposés dans la boîte « Faire la maintenance »
 * (changement de roues, plaquettes de frein, grosse maintenance...). Même
 * patron que les onglets éléments de bord / postes d'entretien.
 */
export function OngletTravauxMaintenance() {
  const { data, isLoading, isError } = useTravauxMaintenance();
  const changerActivation = useChangerActivationTravailMaintenance();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [edite, setEdite] = useState<TravailMaintenance | null>(null);

  const ouvrir = (travail: TravailMaintenance | null) => {
    setEdite(travail);
    setDialogOuvert(true);
  };

  const basculer = async (travail: TravailMaintenance) => {
    try {
      await changerActivation.mutateAsync({ id: travail.idTravailMaintenance, actif: !travail.actif });
      toast.success(travail.actif ? "Travail désactivé" : "Travail réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const colonnes: DataTableColumn<TravailMaintenance>[] = [
    { key: "libelle", header: "Travail", render: (t) => <span className="font-medium">{t.libelle}</span> },
    {
      key: "type",
      header: "Type proposé",
      render: (t) => (
        <Badge variant={t.typeMaintenance === "CORRECTIVE" ? "warning" : "secondary"}>
          {t.typeMaintenance === "CORRECTIVE" ? "Corrective" : "Préventive"}
        </Badge>
      ),
    },
    { key: "portee", header: "S'applique à", render: (t) => LIBELLES_PORTEE[t.portee] },
    { key: "ordre", header: "Ordre", render: (t) => t.ordre },
    {
      key: "actif",
      header: "Statut",
      render: (t) =>
        t.actif ? <span className="text-success">Actif</span> : <span className="text-muted-foreground">Inactif</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Travaux proposés dans « Faire la maintenance » ; plusieurs peuvent être cochés pour une même maintenance.
        </p>
        <Button onClick={() => ouvrir(null)}>
          <Plus className="h-4 w-4" />
          Nouveau travail
        </Button>
      </div>
      <DataTable
        columns={colonnes}
        data={data}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(t) => t.idTravailMaintenance}
        rowActions={(travail) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions — ${travail.libelle}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => ouvrir(travail)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => basculer(travail)}>{travail.actif ? "Désactiver" : "Activer"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <TravailMaintenanceFormDialog travail={edite} open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}
