import { useState } from "react";
import { Loader2, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { DispositifFormDialog } from "@/features/gps/DispositifFormDialog";
import { FlotteMap } from "@/features/gps/FlotteMap";
import {
  useCloturerTrajet,
  useDernieresPositions,
  useDesactiverDispositif,
  useDispositifsGps,
  useReactiverDispositif,
  useRetirerDispositif,
} from "@/features/gps/api";
import { formatDateTime, formatNombre } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { DispositifGps, PositionGps, Trajet } from "@/types/gps";
import { toast } from "sonner";

function DispositifsTab() {
  const { data: dispositifs, isLoading, isError } = useDispositifsGps();
  const desactiver = useDesactiverDispositif();
  const reactiver = useReactiverDispositif();
  const retirer = useRetirerDispositif();
  const [dialogOuvert, setDialogOuvert] = useState(false);

  const onAction = async (action: "desactiver" | "reactiver" | "retirer", dispositif: DispositifGps) => {
    try {
      if (action === "desactiver") await desactiver.mutateAsync(dispositif.idDispositifGps);
      if (action === "reactiver") await reactiver.mutateAsync(dispositif.idDispositifGps);
      if (action === "retirer") await retirer.mutateAsync(dispositif.idDispositifGps);
      toast.success("Dispositif mis à jour");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<DispositifGps>[] = [
    { key: "numeroSerie", header: "N° de série", render: (d) => <span className="font-medium">{d.numeroSerie}</span> },
    { key: "engin", header: "Véhicule", render: (d) => d.libelleVehicule ?? "—" },
    { key: "statut", header: "Statut", render: (d) => <StatutBadge statut={d.statut} /> },
    { key: "installation", header: "Installé le", render: (d) => formatDateTime(d.dateInstallation) },
    { key: "derniereTransmission", header: "Dernière transmission", render: (d) => formatDateTime(d.derniereTransmission) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOuvert(true)}>
          <Plus className="h-4 w-4" />
          Installer un dispositif
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={dispositifs}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(d) => d.idDispositifGps}
        rowActions={(dispositif) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={dispositif.statut !== "ACTIF"}
                onSelect={() => onAction("desactiver", dispositif)}
              >
                Désactiver
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={dispositif.statut === "ACTIF"}
                onSelect={() => onAction("reactiver", dispositif)}
              >
                Réactiver
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={dispositif.statut === "HORS_SERVICE"}
                onSelect={() => onAction("retirer", dispositif)}
                className="text-destructive focus:text-destructive"
              >
                Retirer (hors service)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <DispositifFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}

function PositionsTab() {
  const { data: dispositifs } = useDispositifsGps();
  const [idDispositif, setIdDispositif] = useState<string>("");
  const idSelectionne = idDispositif ? Number(idDispositif) : null;
  const { data: positions, isLoading, isError } = useDernieresPositions(idSelectionne);

  const columns: DataTableColumn<PositionGps>[] = [
    { key: "horodatage", header: "Horodatage", render: (p) => formatDateTime(p.horodatage) },
    { key: "latitude", header: "Latitude", render: (p) => formatNombre(p.latitude, 6) },
    { key: "longitude", header: "Longitude", render: (p) => formatNombre(p.longitude, 6) },
    { key: "vitesse", header: "Vitesse (km/h)", render: (p) => formatNombre(p.vitesse, 1) },
    { key: "mission", header: "Mission", render: (p) => p.idMission ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="max-w-xs space-y-2">
        <Label>Dispositif GPS</Label>
        <Select value={idDispositif} onValueChange={setIdDispositif}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un dispositif" />
          </SelectTrigger>
          <SelectContent>
            {dispositifs?.map((d) => (
              <SelectItem key={d.idDispositifGps} value={String(d.idDispositifGps)}>
                {d.numeroSerie} — {d.libelleVehicule ?? "non installé"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {idSelectionne ? (
        <DataTable
          columns={columns}
          data={positions}
          isLoading={isLoading}
          isError={isError}
          getRowKey={(p) => p.idPositionGps}
          emptyMessage="Aucune position enregistrée pour ce dispositif."
        />
      ) : (
        <p className="text-sm text-muted-foreground">Choisissez un dispositif pour afficher ses dernières positions.</p>
      )}
    </div>
  );
}

function TrajetsTab() {
  const [idMission, setIdMission] = useState("");
  const [dernierTrajet, setDernierTrajet] = useState<Trajet | null>(null);
  const cloturer = useCloturerTrajet();

  const onCloturer = async () => {
    const id = Number(idMission);
    if (!Number.isInteger(id) || id <= 0) return toast.error("Identifiant de mission invalide");
    try {
      const trajet = await cloturer.mutateAsync(id);
      setDernierTrajet(trajet);
      toast.success("Trajet clôturé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Clôture impossible");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="max-w-md">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Calcule distance et vitesses à partir des positions enregistrées, et clôture le trajet d'une mission
            terminée.
          </p>
          <div className="space-y-2">
            <Label htmlFor="idMission">Identifiant de la mission</Label>
            <Input id="idMission" type="number" min={1} value={idMission} onChange={(e) => setIdMission(e.target.value)} />
          </div>
          <Button onClick={onCloturer} disabled={cloturer.isPending}>
            {cloturer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Clôturer le trajet
          </Button>
        </CardContent>
      </Card>

      {dernierTrajet && (
        <Card className="max-w-md">
          <CardContent className="space-y-2 pt-6 text-sm">
            <p>
              <span className="text-muted-foreground">Distance parcourue : </span>
              {formatNombre(dernierTrajet.distanceParcourueKm, 1)} km
            </p>
            <p>
              <span className="text-muted-foreground">Vitesse moyenne : </span>
              {formatNombre(dernierTrajet.vitesseMoyenne, 1)} km/h
            </p>
            <p>
              <span className="text-muted-foreground">Vitesse maximale constatée : </span>
              {formatNombre(dernierTrajet.vitesseMaximaleConstatee, 1)} km/h
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function GpsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="GPS et trajets" description="Dispositifs GPS, positions et trajets des missions." />
      <Tabs defaultValue="carte">
        <TabsList>
          <TabsTrigger value="carte">Carte</TabsTrigger>
          <TabsTrigger value="dispositifs">Dispositifs</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="trajets">Trajets</TabsTrigger>
        </TabsList>
        <TabsContent value="carte">
          <FlotteMap />
        </TabsContent>
        <TabsContent value="dispositifs">
          <DispositifsTab />
        </TabsContent>
        <TabsContent value="positions">
          <PositionsTab />
        </TabsContent>
        <TabsContent value="trajets">
          <TrajetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
