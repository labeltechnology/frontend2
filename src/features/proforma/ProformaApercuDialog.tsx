import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFactureProformaPdf } from "@/features/proforma/api";
import { ApiError } from "@/lib/api-client";
import { declencherTelechargementBlob } from "@/lib/utils";
import type { FactureProforma } from "@/types/proforma";
import { toast } from "sonner";

interface ProformaApercuDialogProps {
  proforma: FactureProforma | null;
  onOpenChange: (open: boolean) => void;
}

/** Aperçu PDF d'une facture proforma — même patron que FactureApercuDialog (factures de location). */
export function ProformaApercuDialog({ proforma, onOpenChange }: ProformaApercuDialogProps) {
  const proformaPdf = useFactureProformaPdf();
  const [pdfPreview, setPdfPreview] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    setPdfPreview(null);
    if (!proforma) return;
    let annule = false;

    proformaPdf
      .mutateAsync(proforma.idFactureProforma)
      .then((blob) => {
        if (annule) return;
        setPdfPreview({ blob, url: URL.createObjectURL(blob) });
      })
      .catch((e) => {
        if (!annule) toast.error(e instanceof ApiError ? e.message : "Aperçu de la facture proforma indisponible");
      });

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proforma?.idFactureProforma]);

  useEffect(() => {
    return () => {
      if (pdfPreview) URL.revokeObjectURL(pdfPreview.url);
    };
  }, [pdfPreview]);

  const onTelecharger = async () => {
    if (!proforma) return;
    try {
      const blob = pdfPreview?.blob ?? (await proformaPdf.mutateAsync(proforma.idFactureProforma));
      declencherTelechargementBlob(blob, `facture-proforma-${proforma.reference}.pdf`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Téléchargement impossible");
    }
  };

  return (
    <Dialog open={!!proforma} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Proforma {proforma?.reference}</DialogTitle>
          <DialogDescription>{proforma?.clientNom}</DialogDescription>
        </DialogHeader>

        {!pdfPreview && (
          <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération de l'aperçu…
          </div>
        )}
        {pdfPreview && (
          <iframe
            src={pdfPreview.url}
            title="Aperçu PDF de la facture proforma"
            className="h-[60vh] w-full rounded-md border"
          />
        )}
        <div className="flex justify-end">
          <Button onClick={onTelecharger} disabled={proformaPdf.isPending}>
            <Download className="h-4 w-4" />
            Télécharger le PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
