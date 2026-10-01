import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { TypeEnginFormDialog } from "@/features/engins/TypeEnginFormDialog";
import { useChangerActivationTypeEngin, useTypesEngin } from "@/features/engins/api";
import { ApiError } from "@/lib/api-client";
import type { TypeEngin } from "@/types/engin";
import { resumeReglagesType } from "@/features/performance/reglages-type";
import { toast } from "sonner";

/**
 * Ajouté le 2026-09-22 (demande explicite de l'utilisateur — « les engins ne
 * sont pas les mêmes que les véhicules ou camions ») : jusque-là les types
 * de véhicule étaient créés directement en base, faute d'écran. La catégorie
 * choisie ici détermine, côté fiche engin (EnginFormDialog), si c'est
 * l'immatriculation ou le numéro de série qui est demandé.
 */
export function TypesEnginPage() {
  const { data: typesEngin, isLoading, isError } = useTypesEngin();
  const changerActivation = useChangerActivationTypeEngin();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [typeEnginEdite, setTypeEnginEdite] = useState<TypeEngin | null>(null);

  const ouvrirCreation = () => {
    setTypeEnginEdite(null);
    setDialogOuvert(true);
  };

  const ouvrirEdition = (type: TypeEngin) => {
    setTypeEnginEdite(type);
    setDialogOuvert(true);
  };

  const onToggleActivation = async (type: TypeEngin) => {
    try {
      await changerActivation.mutateAsync({ id: type.idTypeEngin, actif: !type.actif });
      toast.success(type.actif ? "Type désactivé" : "Type réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<TypeEngin>[] = [
    { key: "libelle", header: "Libellé", render: (t) => <span className="font-medium">{t.libelle}</span> },
    {
      key: "categorie",
      header: "Catégorie",
      render: (t) =>
        t.categorie === "ENGIN_CHANTIER" ? (
          <Badge variant="warning">Engin de chantier</Badge>
        ) : (
          <Badge variant="default">Véhicule routier</Badge>
        ),
    },
    {
      key: "famille",
      header: "Famille",
      render: (t) => t.famille ?? <span className="text-muted-foreground">—</span>,
    },
    { key: "vitesseMaximale", header: "Vitesse maximale", render: (t) => `${t.vitesseMaximale ?? "—"} km/h` },
    {
      key: "performance",
      header: "Seuils et coût de référence",
      render: (t) => <span className="text-sm text-muted-foreground">{resumeReglagesType(t)}</span>,
    },
    {
      key: "actif",
      header: "Statut",
      render: (t) =>
        t.actif ? <span className="text-success">Actif</span> : <span className="text-muted-foreground">Inactif</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Types de véhicule"
        description="Référentiel des types de véhicule (véhicules routiers et engins de chantier) — détermine la vitesse maximale autorisée et l'identifiant exigé (immatriculation ou numéro de série)."
        actions={
          <Button onClick={ouvrirCreation}>
            <Plus className="h-4 w-4" />
            Nouveau type
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={typesEngin}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(t) => t.idTypeEngin}
        rowActions={(type) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => ouvrirEdition(type)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleActivation(type)}>
                {type.actif ? "Désactiver" : "Activer"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      <TypeEnginFormDialog typeEngin={typeEnginEdite} open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </div>
  );
}
