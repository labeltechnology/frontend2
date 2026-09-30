import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable, type DataTableColumn, type FiltreRapide } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { CarburantFormDialog } from "@/features/carburant/CarburantFormDialog";
import { useCarburant, useConsommationMoyenne } from "@/features/carburant/api";
import { libelleApprovisionnement } from "@/features/carburant/approvisionnement";
import { useEngins } from "@/features/engins/api";
import { formatDateTime, formatMontant, formatNombre } from "@/lib/utils";
import type { Carburant } from "@/types/carburant";
import { libelleVehicule } from "@/lib/vehicule";

function ConsommationCard() {
  const { data: engins } = useEngins();
  const [idEngin, setIdEngin] = useState("");
  const idSelectionne = idEngin ? Number(idEngin) : null;
  const { data: consommation } = useConsommationMoyenne(idSelectionne);

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label>Consommation moyenne par véhicule</Label>
          <Select value={idEngin} onValueChange={setIdEngin}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un véhicule" />
            </SelectTrigger>
            <SelectContent>
              {engins?.map((e) => (
                <SelectItem key={e.idEngin} value={String(e.idEngin)}>
                  {libelleVehicule(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {consommation && (
          <p className="text-sm">
            <span className="font-medium">{formatNombre(consommation.litresAux100Km, 2)} L/100km</span>{" "}
            <span className="text-muted-foreground">
              (sur {consommation.nombrePleinsConsideres} pleins considérés)
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Filtre rapide par type de saisie (2026-09-30). */
const FILTRE_TYPE_PLEIN: FiltreRapide<Carburant> = {
  libelle: "Filtrer par type de saisie",
  valeur: (c) => c.typeApprovisionnement ?? "PLEIN_COMPLET",
  options: [
    { valeur: "PLEIN_COMPLET", libelle: "Plein complet" },
    { valeur: "APPOINT", libelle: "Appoint" },
    { valeur: "BIDON", libelle: "Bidon" },
  ],
};

export function CarburantPage() {
  const { data: carburant, isLoading, isError } = useCarburant();
  const [dialogOuvert, setDialogOuvert] = useState(false);

  const columns: DataTableColumn<Carburant>[] = [
    { key: "engin", header: "Véhicule", render: (c) => <span className="font-medium">{libelleVehicule(c.engin)}</span>, sortValue: (c) => libelleVehicule(c.engin), mobile: "titre" },
    { key: "conducteur", header: "Conducteur", render: (c) => (c.conducteur ? `${c.conducteur.nom} ${c.conducteur.prenom}` : "—"), sortValue: (c) => (c.conducteur ? `${c.conducteur.nom} ${c.conducteur.prenom}` : null) },
    { key: "dateHeure", header: "Date", render: (c) => formatDateTime(c.dateHeure), sortValue: (c) => c.dateHeure },
    { key: "type", header: "Type", render: (c) => libelleApprovisionnement(c.typeApprovisionnement) },
    { key: "kilometrage", header: "Kilométrage", render: (c) => formatNombre(c.kilometrageAuPlein), sortValue: (c) => c.kilometrageAuPlein },
    { key: "litres", header: "Litres", render: (c) => formatNombre(c.quantiteLitres, 2), sortValue: (c) => c.quantiteLitres },
    { key: "prixUnitaire", header: "Prix / L", render: (c) => formatMontant(c.prixUnitaire) },
    { key: "montant", header: "Montant total", render: (c) => formatMontant(c.montantTotal), sortValue: (c) => c.montantTotal },
    { key: "station", header: "Station", render: (c) => c.station ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carburant"
        description="Pleins de carburant et suivi de la consommation."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouveau plein
          </Button>
        }
      />

      <ConsommationCard />

      <DataTable
        columns={columns}
        data={carburant}
        cleMemoire="carburant"
        filtreRapide={FILTRE_TYPE_PLEIN}
        recherche={{ texte: (c) => `${libelleVehicule(c.engin)} ${c.conducteur ? `${c.conducteur.nom} ${c.conducteur.prenom}` : ""} ${c.station ?? ""}`, placeholder: "Véhicule, conducteur, station…" }}
        libelles={["saisie", "saisies"]}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(c) => c.idCarburant}
      />

      <CarburantFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}
