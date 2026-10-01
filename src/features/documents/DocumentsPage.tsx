import { useState } from "react";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn, type FiltreRapide } from "@/components/data-table/DataTable";
import { PageHeader } from "@/components/data-table/PageHeader";
import { DocumentFormDialog } from "@/features/documents/DocumentFormDialog";
import { useDocuments, useRemplacerDocument } from "@/features/documents/api";
import { formatDate } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { Document } from "@/types/document";
import { LIBELLES_TYPE_DOCUMENT } from "@/features/documents/libelles";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

/** Véhicule ou conducteur concerné (2026-09-30 : partagé par la colonne, le tri et la recherche). */
function cibleDocument(d: Document): string {
  return (d.engin ? libelleVehicule(d.engin) : null) ?? (d.conducteur ? `${d.conducteur.nom} ${d.conducteur.prenom}` : "—");
}

/** Filtre rapide : version en vigueur ou remplacée (2026-09-30). */
const FILTRE_ETAT_DOCUMENT: FiltreRapide<Document> = {
  libelle: "Filtrer par état",
  valeur: (d) => (d.actif ? "ACTIF" : "REMPLACE"),
  options: [
    { valeur: "ACTIF", libelle: "Actifs" },
    { valeur: "REMPLACE", libelle: "Remplacés" },
  ],
};

export function DocumentsPage() {
  const { data: documents, isLoading, isError } = useDocuments();
  const remplacer = useRemplacerDocument();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [cible, setCible] = useState<Document | null>(null);
  const [dateExpiration, setDateExpiration] = useState("");
  const [numeroReference, setNumeroReference] = useState("");

  const ouvrirRemplacement = (document: Document) => {
    setCible(document);
    setDateExpiration(document.dateExpiration ?? "");
    setNumeroReference(document.numeroReference ?? "");
  };

  const onValiderRemplacement = async () => {
    if (!cible) return;
    try {
      await remplacer.mutateAsync({
        id: cible.idDocument,
        requete: {
          numeroReference: numeroReference || undefined,
          dateExpiration: dateExpiration || undefined,
        },
      });
      toast.success("Document remplacé");
      setCible(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Remplacement impossible");
    }
  };

  const columns: DataTableColumn<Document>[] = [
    { key: "type", header: "Type", render: (d) => <span className="font-medium">{LIBELLES_TYPE_DOCUMENT[d.type] ?? d.type}</span>, sortValue: (d) => LIBELLES_TYPE_DOCUMENT[d.type] ?? d.type, mobile: "titre" },
    { key: "cible", header: "Concerne", render: (d) => cibleDocument(d), sortValue: (d) => cibleDocument(d) },
    { key: "reference", header: "Référence", render: (d) => d.numeroReference ?? "—" },
    { key: "debut", header: "Début", render: (d) => formatDate(d.dateDebut) },
    { key: "expiration", header: "Expiration", render: (d) => formatDate(d.dateExpiration), sortValue: (d) => d.dateExpiration },
    { key: "version", header: "Version", render: (d) => `v${d.version}` },
    {
      key: "actif",
      header: "Statut",
      render: (d) => <Badge variant={d.actif ? "success" : "outline"}>{d.actif ? "Actif" : "Remplacé"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Documents administratifs des véhicules et conducteurs (aucune suppression possible : chaque document est remplacé par une nouvelle version)."
        actions={
          <Button onClick={() => setDialogOuvert(true)}>
            <Plus className="h-4 w-4" />
            Nouveau document
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={documents}
        cleMemoire="documents"
        filtreRapide={FILTRE_ETAT_DOCUMENT}
        recherche={{ texte: (d) => `${LIBELLES_TYPE_DOCUMENT[d.type] ?? d.type} ${cibleDocument(d)} ${d.numeroReference ?? ""}`, placeholder: "Type, véhicule, conducteur, référence…" }}
        libelles={["document", "documents"]}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(d) => d.idDocument}
        rowActions={(document) => (
          <Button variant="outline" size="sm" disabled={!document.actif} onClick={() => ouvrirRemplacement(document)}>
            <RefreshCcw className="h-4 w-4" />
            Remplacer
          </Button>
        )}
      />

      <DocumentFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />

      <Dialog open={!!cible} onOpenChange={(open) => !open && setCible(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remplacer le document</DialogTitle>
            <DialogDescription>{cible ? LIBELLES_TYPE_DOCUMENT[cible.type] : ""} — crée une nouvelle version, l'ancienne reste consultable.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroReferenceRemplacement">Nouveau numéro de référence</Label>
              <Input id="numeroReferenceRemplacement" value={numeroReference} onChange={(e) => setNumeroReference(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateExpirationRemplacement">Nouvelle date d'expiration</Label>
              <Input
                id="dateExpirationRemplacement"
                type="date"
                value={dateExpiration}
                onChange={(e) => setDateExpiration(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onValiderRemplacement} disabled={remplacer.isPending}>
              {remplacer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Remplacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
