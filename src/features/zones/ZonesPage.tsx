import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { ZoneFormDialog } from "@/features/zones/ZoneFormDialog";
import { useActiverZone, useDesactiverZone, useZones } from "@/features/zones/api";
import { libelleEnum } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { ZoneGeographique } from "@/types/zone";
import { toast } from "sonner";

export function ZonesPage() {
  const { data: zones, isLoading, isError } = useZones();
  const desactiver = useDesactiverZone();
  const activer = useActiverZone();
  const [dialogOuvert, setDialogOuvert] = useState(false);

  const onToggle = async (zone: ZoneGeographique) => {
    try {
      if (zone.actif) {
        await desactiver.mutateAsync(zone.idZoneGeographique);
        toast.success("Zone désactivée");
      } else {
        await activer.mutateAsync(zone.idZoneGeographique);
        toast.success("Zone activée");
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<ZoneGeographique>[] = [
    { key: "nom", header: "Nom", render: (z) => <span className="font-medium">{z.nom}</span> },
    { key: "type", header: "Type", render: (z) => libelleEnum(z.type) },
    { key: "mode", header: "Mode", render: (z) => libelleEnum(z.modeDefinition) },
    {
      key: "definition",
      header: "Définition",
      render: (z) =>
        z.modeDefinition === "CERCLE"
          ? `${z.centreLatitude?.toFixed(4)}, ${z.centreLongitude?.toFixed(4)} (${z.rayonMetres} m)`
          : "Polygone",
    },
    {
      key: "actif",
      header: "Statut",
      render: (z) => <Badge variant={z.actif ? "success" : "outline"}>{z.actif ? "Active" : "Inactive"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zones géographiques"
        description="Zones autorisées ou interdites utilisées pour la surveillance GPS."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle zone
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={zones}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(z) => z.idZoneGeographique}
        rowActions={(zone) => (
          <Button variant="outline" size="sm" onClick={() => onToggle(zone)}>
            {zone.actif ? "Désactiver" : "Activer"}
          </Button>
        )}
      />

      <ZoneFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}
