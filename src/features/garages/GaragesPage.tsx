import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { GarageFormDialog } from "@/features/garages/GarageFormDialog";
import { useChangerActivationGarage, useGaragesExternes } from "@/features/garages/api";
import { FacturesGarageDialog } from "@/features/factures-garage/FacturesGarageDialog";
import { useAuth } from "@/features/auth/useAuth";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import type { GarageExterne } from "@/types/garage";
import { toast } from "sonner";

export function GaragesPage() {
  const { session } = useAuth();
  // Pages par métier (2026-09-30) : la comptable voit les factures, l'atelier modifie les garages.
  const peutModifier = peut(session?.role, "GERER_MAINTENANCE");
  const voitFactures = peut(session?.role, "VOIR_FINANCES");
  const { data: garages, isLoading, isError } = useGaragesExternes();
  const changerActivation = useChangerActivationGarage();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<GarageExterne | null>(null);
  const [aFacturer, setAFacturer] = useState<GarageExterne | null>(null);

  const onOuvrirEdition = (garage: GarageExterne) => {
    setEnEdition(garage);
    setDialogOuvert(true);
  };

  const onOuvrirCreation = () => {
    setEnEdition(null);
    setDialogOuvert(true);
  };

  const onToggleActivation = async (garage: GarageExterne) => {
    try {
      await changerActivation.mutateAsync({ id: garage.idGarageExterne, actif: !garage.actif });
      toast.success(garage.actif ? "Garage désactivé" : "Garage réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<GarageExterne>[] = [
    { key: "nom", header: "Nom", render: (g) => <span className="font-medium">{g.nom}</span> },
    { key: "contact", header: "Contact", render: (g) => g.personneContact ?? "—" },
    { key: "telephone", header: "Téléphone", render: (g) => g.telephone ?? "—" },
    { key: "email", header: "Email", render: (g) => g.email ?? "—" },
    {
      key: "actif",
      header: "Statut",
      render: (g) => <Badge variant={g.actif ? "success" : "outline"}>{g.actif ? "Actif" : "Inactif"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garages externes"
        description="Garages pouvant réaliser une maintenance hors de l'atelier interne."
        actions={
          peutModifier ? (
            <Button onClick={onOuvrirCreation}>
              <Plus className="h-4 w-4" />
              Nouveau garage
            </Button>
          ) : undefined
        }
      />

      <DataTable
        columns={columns}
        data={garages}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(g) => g.idGarageExterne}
        rowActions={(garage) => (
          <div className="flex justify-end gap-2">
            {peutModifier && (
              <>
                <Button variant="outline" size="sm" onClick={() => onOuvrirEdition(garage)}>
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={() => onToggleActivation(garage)}>
                  {garage.actif ? "Désactiver" : "Activer"}
                </Button>
              </>
            )}
            {voitFactures && (
              <Button variant="outline" size="sm" onClick={() => setAFacturer(garage)}>
                Factures
              </Button>
            )}
          </div>
        )}
      />

      <GarageFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} garage={enEdition} />
      <FacturesGarageDialog garage={aFacturer} onOpenChange={(open) => !open && setAFacturer(null)} />
    </div>
  );
}
