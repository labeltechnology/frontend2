import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
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
import { DataTable, type DataTableColumn } from "@/components/data-table/DataTable";
import { PieceFormDialog } from "@/features/maintenance/PieceFormDialog";
import { useApprovisionnerPiece, usePieces } from "@/features/maintenance/api";
import { formatMontant } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";
import type { Piece } from "@/types/maintenance";
import { toast } from "sonner";

/** Onglet « Pièces » de la page Maintenance (sorti de MaintenancePage.tsx le 2026-09-28, sans changement). */
export function OngletPieces() {
  const { data: pieces, isLoading, isError } = usePieces();
  const approvisionner = useApprovisionnerPiece();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [cible, setCible] = useState<Piece | null>(null);
  const [quantite, setQuantite] = useState("");

  const onValider = async () => {
    if (!cible) return;
    const nombre = Number(quantite);
    if (!Number.isInteger(nombre) || nombre <= 0) return toast.error("Quantité invalide");
    try {
      await approvisionner.mutateAsync({ id: cible.idPiece, quantite: nombre });
      toast.success("Stock approvisionné");
      setCible(null);
      setQuantite("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const columns: DataTableColumn<Piece>[] = [
    { key: "reference", header: "Référence", render: (p) => <span className="font-medium">{p.reference}</span> },
    { key: "nom", header: "Nom", render: (p) => p.nom },
    { key: "prixUnitaire", header: "Prix unitaire", render: (p) => formatMontant(p.prixUnitaire) },
    {
      key: "stock",
      header: "Stock",
      render: (p) => (
        <span className={p.stockBas ? "font-medium text-destructive" : undefined}>
          {p.quantiteStock} (seuil {p.seuilAlerteStock})
        </span>
      ),
    },
    { key: "fournisseur", header: "Fournisseur", render: (p) => p.nomFournisseur ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOuvert(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle pièce
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={pieces}
        isLoading={isLoading}
        isError={isError}
        getRowKey={(p) => p.idPiece}
        rowActions={(piece) => (
          <Button variant="outline" size="sm" onClick={() => setCible(piece)}>
            Approvisionner
          </Button>
        )}
      />
      <PieceFormDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />

      <Dialog open={!!cible} onOpenChange={(open) => !open && setCible(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approvisionner le stock</DialogTitle>
            <DialogDescription>{cible?.nom}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quantiteApprovisionnee">Quantité à ajouter</Label>
            <Input
              id="quantiteApprovisionnee"
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={onValider} disabled={approvisionner.isPending}>
              {approvisionner.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
