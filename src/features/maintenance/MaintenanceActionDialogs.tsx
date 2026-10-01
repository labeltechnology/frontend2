import { useRef, useState, type ChangeEvent } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAjouterPieceMaintenance, usePieces, useTerminerMaintenance } from "@/features/maintenance/api";
import { useMaintenanceProforma, useTeleverserProforma } from "@/features/maintenance/proforma-api";
import { ControleClotureChamps } from "@/features/maintenance/ControleClotureChamps";
import {
  CONTROLE_VIDE,
  erreurControle,
  requeteControle,
  type SaisieControle,
} from "@/features/maintenance/controle-cloture";
import type { Maintenance } from "@/types/maintenance";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface MaintenanceActionDialogsProps {
  ajouterPieceCible: Maintenance | null;
  terminerCible: Maintenance | null;
  onFermer: () => void;
}

export function MaintenanceActionDialogs({
  ajouterPieceCible,
  terminerCible,
  onFermer,
}: MaintenanceActionDialogsProps) {
  const { data: pieces } = usePieces();
  const [idPiece, setIdPiece] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [prochaineDateEntretien, setProchaineDateEntretien] = useState("");
  const [controle, setControle] = useState<SaisieControle>(CONTROLE_VIDE);
  const ajouterPiece = useAjouterPieceMaintenance();
  const terminer = useTerminerMaintenance();

  // Garage externe : le proforma doit être téléversé avant de pouvoir clôturer (règle validée avec
  // l'utilisateur — « il faut uplouader aussi le facture proformat du garage externe avant de valider
  // la maintenance externe »). Sans objet pour une maintenance en atelier interne.
  const estGarageExterne = terminerCible?.idGarageExterne != null;
  const idMaintenanceCible = terminerCible?.idMaintenance;
  const { data: proforma, isLoading: proformaEnChargement } = useMaintenanceProforma(
    estGarageExterne ? idMaintenanceCible : undefined,
  );
  const televerserProforma = useTeleverserProforma(idMaintenanceCible);
  const proformaInputRef = useRef<HTMLInputElement>(null);
  const proformaManquant = estGarageExterne && (proformaEnChargement || !proforma);

  const fermer = () => {
    setIdPiece("");
    setQuantite("1");
    setProchaineDateEntretien("");
    setControle(CONTROLE_VIDE);
    onFermer();
  };

  const onAjouterPiece = async () => {
    if (!ajouterPieceCible) return;
    const idPieceNombre = Number(idPiece);
    const quantiteNombre = Number(quantite);
    if (!idPieceNombre) return toast.error("Sélectionnez une pièce.");
    if (!Number.isInteger(quantiteNombre) || quantiteNombre <= 0) return toast.error("Quantité invalide");
    try {
      await ajouterPiece.mutateAsync({
        id: ajouterPieceCible.idMaintenance,
        requete: { idPiece: idPieceNombre, quantite: quantiteNombre },
      });
      toast.success("Pièce ajoutée à la maintenance");
      fermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onTerminer = async () => {
    if (!terminerCible) return;
    const erreur = erreurControle(controle);
    if (erreur) return toast.error(erreur);
    try {
      await terminer.mutateAsync({
        id: terminerCible.idMaintenance,
        prochaineDateEntretien: prochaineDateEntretien || undefined,
        controle: requeteControle(controle),
      });
      toast.success(controle.reserve.trim() ? "Maintenance terminée avec une réserve (alerte créée)" : "Maintenance terminée");
      fermer();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action impossible");
    }
  };

  const onChoisirProforma = () => proformaInputRef.current?.click();

  const onProformaSelectionne = async (e: ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    try {
      await televerserProforma.mutateAsync(fichier);
      toast.success("Facture pro forma téléversée");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi de la facture pro forma impossible");
    }
  };

  return (
    <>
      <Dialog open={!!ajouterPieceCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une pièce utilisée</DialogTitle>
            <DialogDescription>Maintenance de {libelleVehicule(ajouterPieceCible?.engin)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pièce</Label>
              <Select value={idPiece} onValueChange={setIdPiece}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {pieces?.map((p) => (
                    <SelectItem key={p.idPiece} value={String(p.idPiece)}>
                      {p.nom} ({p.reference}) — stock {p.quantiteStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité utilisée</Label>
              <Input id="quantite" type="number" min={1} value={quantite} onChange={(e) => setQuantite(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onAjouterPiece} disabled={ajouterPiece.isPending}>
              {ajouterPiece.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!terminerCible} onOpenChange={(open) => !open && fermer()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminer la maintenance</DialogTitle>
            <DialogDescription>{libelleVehicule(terminerCible?.engin)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="prochaineDateEntretien">Prochaine date d'entretien (facultatif)</Label>
            <Input
              id="prochaineDateEntretien"
              type="date"
              value={prochaineDateEntretien}
              onChange={(e) => setProchaineDateEntretien(e.target.value)}
            />
          </div>

          <ControleClotureChamps valeur={controle} onChange={setControle} />

          {estGarageExterne && (
            <div className="space-y-2 rounded-md border px-3 py-2">
              <Label>Facture pro forma du garage externe</Label>
              <input
                ref={proformaInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onProformaSelectionne}
              />
              {proformaEnChargement && <p className="text-sm text-muted-foreground">Vérification…</p>}
              {!proformaEnChargement && proforma && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {proforma.nomFichierOriginal ?? "Facture pro forma téléversée"}
                </p>
              )}
              {!proformaEnChargement && !proforma && (
                <p className="text-sm text-warning-foreground">
                  Aucune facture pro forma téléversée — obligatoire avant de clôturer une maintenance en garage externe.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onChoisirProforma}
                disabled={televerserProforma.isPending}
              >
                {televerserProforma.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {proforma ? "Remplacer la facture pro forma" : "Téléverser la facture pro forma"}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={onTerminer} disabled={terminer.isPending || proformaManquant || !controle.essaiOk}>
              {terminer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Terminer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
