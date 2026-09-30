import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { FournisseurFormDialog } from "@/features/fournisseurs/FournisseurFormDialog";
import { useChangerActivationFournisseur, useFournisseurs } from "@/features/fournisseurs/api";
import { ApiError } from "@/lib/api-client";
import type { Fournisseur } from "@/types/fournisseur";
import { toast } from "sonner";

export function FournisseursPage() {
  const { data: fournisseurs, isLoading, isError } = useFournisseurs();
  const changerActivation = useChangerActivationFournisseur();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<Fournisseur | null>(null);

  const onOuvrirEdition = (fournisseur: Fournisseur) => {
    setEnEdition(fournisseur);
    setDialogOuvert(true);
  };

  const onOuvrirCreation = () => {
    setEnEdition(null);
    setDialogOuvert(true);
  };

  const onToggleActivation = async (fournisseur: Fournisseur) => {
    try {
      await changerActivation.mutateAsync({ id: fournisseur.idFournisseur, actif: !fournisseur.actif });
      toast.success(fournisseur.actif ? "Fournisseur désactivé" : "Fournisseur réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<Fournisseur>[] = [
    { key: "nom", header: "Nom", render: (f) => <span className="font-medium">{f.nom}</span> },
    { key: "contact", header: "Contact", render: (f) => f.personneContact ?? "—" },
    { key: "telephone", header: "Téléphone", render: (f) => f.telephone ?? "—" },
    { key: "email", header: "Email", render: (f) => f.email ?? "—" },
    {
      key: "actif",
      header: "Statut",
      render: (f) => <Badge variant={f.actif ? "success" : "outline"}>{f.actif ? "Actif" : "Inactif"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fournisseurs"
        description="Fournisseurs de pièces détachées pour la maintenance."
        actions={
          <Button onClick={onOuvrirCreation}>
            <Plus className="h-4 w-4" />
            Nouveau fournisseur
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={fournisseurs}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(f) => f.idFournisseur}
        rowActions={(fournisseur) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOuvrirEdition(fournisseur)}>
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={() => onToggleActivation(fournisseur)}>
              {fournisseur.actif ? "Désactiver" : "Activer"}
            </Button>
          </div>
        )}
      />

      <FournisseurFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} fournisseur={enEdition} />
    </div>
  );
}
