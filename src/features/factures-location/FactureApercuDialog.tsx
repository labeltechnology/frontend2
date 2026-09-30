import { useEffect, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFactureLocationPdf } from "@/features/factures-location/api";
import { ApiError } from "@/lib/api-client";
import { declencherTelechargementBlob } from "@/lib/utils";
import type { FactureLocation } from "@/types/location";
import { toast } from "sonner";
import { libelleVehicule } from "@/lib/vehicule";

interface FactureApercuDialogProps {
  facture: FactureLocation | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Aperçu PDF d'une facture de location déjà émise — demande explicite de
 * l'utilisateur (« il faut une apercu du facture de location »). Même
 * principe que {@code RapportApercuDialog} (itération 9) : le PDF généré
 * côté serveur est récupéré en blob authentifié dès l'ouverture, puis
 * affiché dans un {@code <iframe>} via {@code createObjectURL}. Pas d'onglet
 * Excel ici (à la différence des rapports) : une facture n'a pas besoin
 * d'un export tableur.
 */
export function FactureApercuDialog({ facture, onOpenChange }: FactureApercuDialogProps) {
  const facturePdf = useFactureLocationPdf();
  const [pdfPreview, setPdfPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setPdfPreview(null);
    setErreur(null);
    if (!facture) return;
    let annule = false;

    facturePdf
      .mutateAsync(facture.idFactureLocation)
      .then((blob) => {
        if (annule) return;
        setPdfPreview({ blob, url: URL.createObjectURL(blob) });
      })
      .catch((e) => {
        if (annule) return;
        // Sans cet état d'erreur, un échec laissait le dialogue bloqué
        // indéfiniment sur « Génération de l'aperçu… ».
        const message = e instanceof ApiError ? e.message : "Aperçu de la facture indisponible";
        setErreur(message);
        toast.error(message);
      });

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facture?.idFactureLocation]);

  useEffect(() => {
    return () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  const onTelecharger = async () => {
    if (!facture) return;
    try {
      const blob = pdfPreview?.blob ?? (await facturePdf.mutateAsync(facture.idFactureLocation));
      declencherTelechargementBlob(blob, `facture-location-${facture.reference}.pdf`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Téléchargement de la facture impossible");
    }
  };

  return (
    <Dialog open={!!facture} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Facture {facture?.reference}</DialogTitle>
          <DialogDescription>
            {libelleVehicule(facture?.contrat.engin)} — {facture?.contrat.nomSociete}
          </DialogDescription>
        </DialogHeader>

        {!pdfPreview && !erreur && (
          <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération de l'aperçu…
          </div>
        )}
        {!pdfPreview && erreur && (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="font-medium text-destructive">Aperçu indisponible</p>
            <p>{erreur}</p>
          </div>
        )}
        {pdfPreview && (
          <iframe
            src={pdfPreview.url}
            title="Aperçu PDF de la facture"
            className="h-[60vh] w-full rounded-md border"
          />
        )}
        <div className="flex justify-end">
          <Button onClick={onTelecharger} disabled={facturePdf.isPending || !!erreur}>
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
