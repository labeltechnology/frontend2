import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { PrestataireLocationFormDialog } from "@/features/prestataire-location/PrestataireLocationFormDialog";
import { useChangerActivationPrestataireLocation, usePrestatairesLocation } from "@/features/prestataire-location/api";
import { ApiError } from "@/lib/api-client";
import type { PrestataireLocation } from "@/types/prestataire-location";
import { toast } from "sonner";

/**
 * Page dédiée de gestion des prestataires de location (choix confirmé avec
 * l'utilisateur : « Oui, page dédiée ») — mirroir exact de FournisseursPage.
 * Alimente le sélecteur du formulaire de contrat de location entrante
 * (ContratLocationEntranteFormDialog), qui n'accepte plus de saisie libre.
 */
export function PrestatairesLocationPage() {
  const { data: prestataires, isLoading, isError } = usePrestatairesLocation();
  const changerActivation = useChangerActivationPrestataireLocation();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState<PrestataireLocation | null>(null);

  const onOuvrirEdition = (prestataire: PrestataireLocation) => {
    setEnEdition(prestataire);
    setDialogOuvert(true);
  };

  const onOuvrirCreation = () => {
    setEnEdition(null);
    setDialogOuvert(true);
  };

  const onToggleActivation = async (prestataire: PrestataireLocation) => {
    try {
      await changerActivation.mutateAsync({ id: prestataire.idPrestataireLocation, actif: !prestataire.actif });
      toast.success(prestataire.actif ? "Prestataire désactivé" : "Prestataire réactivé");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<PrestataireLocation>[] = [
    { key: "nom", header: "Nom", render: (p) => <span className="font-medium">{p.nom}</span> },
    { key: "contact", header: "Contact", render: (p) => p.personneContact ?? "—" },
    { key: "telephone", header: "Téléphone", render: (p) => p.telephone ?? "—" },
    { key: "email", header: "Email", render: (p) => p.email ?? "—" },
    {
      key: "actif",
      header: "Statut",
      render: (p) => <Badge variant={p.actif ? "success" : "outline"}>{p.actif ? "Actif" : "Inactif"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prestataires de location"
        description="Sociétés externes auprès desquelles l'entreprise peut louer un véhicule ou un engin de chantier."
        actions={
          <Button onClick={onOuvrirCreation}>
            <Plus className="h-4 w-4" />
            Nouveau prestataire
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={prestataires}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(p) => p.idPrestataireLocation}
        rowActions={(prestataire) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOuvrirEdition(prestataire)}>
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={() => onToggleActivation(prestataire)}>
              {prestataire.actif ? "Désactiver" : "Activer"}
            </Button>
          </div>
        )}
      />

      <PrestataireLocationFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} prestataire={enEdition} />
    </div>
  );
}
