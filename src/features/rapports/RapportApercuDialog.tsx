import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActionsRapport } from "@/features/rapports/actions-rapport";
import { ApercuRapport } from "@/features/rapports/ApercuRapport";
import { usePresentationRapport, useRapportPdf } from "@/features/rapports/api";
import { definitionRapport } from "@/features/rapports/catalogue";
import { libellePeriode } from "@/features/rapports/liste-rapports";
import { ApiError } from "@/lib/api-client";
import type { Rapport } from "@/types/rapport";

interface RapportApercuDialogProps {
  rapport: Rapport | null;
  onOpenChange: (open: boolean) => void;
  /** Rapport régénéré : la page affiche alors son aperçu à la place. */
  onRegenere: (rapport: Rapport) => void;
}

/**
 * Aperçu d'un rapport (refonte du 2026-09-28 ; NB de l'utilisateur : un aperçu
 * doit précéder tout export) :
 *  - onglet « Aperçu » : chiffres clés, barres et listes — exactement le
 *    contenu du PDF et de l'Excel (même mise en forme serveur) ;
 *  - onglet « PDF » : le vrai PDF, chargé seulement quand on ouvre l'onglet.
 * Actions : télécharger le PDF ou l'Excel, régénérer avec les mêmes paramètres.
 */
export function RapportApercuDialog({ rapport, onOpenChange, onRegenere }: RapportApercuDialogProps) {
  const presentation = usePresentationRapport(rapport?.idRapport ?? null);
  const actions = useActionsRapport();
  const chargementPdf = useRapportPdf();
  const [onglet, setOnglet] = useState("apercu");
  const [pdf, setPdf] = useState<{ id: number; blob: Blob; url: string } | null>(null);

  useEffect(() => {
    setOnglet("apercu");
  }, [rapport?.idRapport]);

  // PDF chargé à la première ouverture de l'onglet, puis gardé pour le téléchargement.
  useEffect(() => {
    if (!rapport || onglet !== "pdf" || pdf?.id === rapport.idRapport) return;
    let annule = false;
    chargementPdf
      .mutateAsync(rapport.idRapport)
      .then((blob) => {
        if (!annule) setPdf({ id: rapport.idRapport, blob, url: URL.createObjectURL(blob) });
      })
      .catch((e) => {
        if (!annule) toast.error(e instanceof ApiError ? e.message : "Aperçu PDF indisponible");
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rapport?.idRapport, onglet]);

  useEffect(() => {
    return () => {
      if (pdf) URL.revokeObjectURL(pdf.url);
    };
  }, [pdf]);

  const regenerer = async () => {
    if (!rapport) return;
    const nouveau = await actions.regenerer(rapport);
    if (nouveau) onRegenere(nouveau);
  };

  const pdfCourant = rapport && pdf?.id === rapport.idRapport ? pdf : null;

  return (
    <Dialog open={!!rapport} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{rapport ? `${definitionRapport(rapport.type).titre} — n° ${rapport.idRapport}` : ""}</DialogTitle>
          <DialogDescription>
            {rapport && [rapport.libelleCible ?? "Tout le parc", libellePeriode(rapport)].join(" · ")}
          </DialogDescription>
        </DialogHeader>

        {rapport && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Tabs value={onglet} onValueChange={setOnglet}>
              <TabsList>
                <TabsTrigger value="apercu">Aperçu</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={regenerer} disabled={actions.regenerationEnCours}>
                {actions.regenerationEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Régénérer
              </Button>
              <Button variant="outline" size="sm" onClick={() => actions.telechargerExcel(rapport)} disabled={actions.excelEnCours}>
                {actions.excelEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Excel
              </Button>
              <Button size="sm" onClick={() => actions.telechargerPdf(rapport, pdfCourant?.blob)} disabled={actions.pdfEnCours}>
                {actions.pdfEnCours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Télécharger le PDF
              </Button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border p-4">
          {onglet === "apercu" ? (
            presentation.isLoading ? (
              <Chargement texte="Mise en forme du rapport…" />
            ) : presentation.isError || !presentation.data ? (
              <p className="text-sm text-destructive">Impossible d'afficher ce rapport.</p>
            ) : (
              <ApercuRapport presentation={presentation.data} />
            )
          ) : pdfCourant ? (
            <iframe src={pdfCourant.url} title="Aperçu PDF du rapport" className="h-[65vh] w-full rounded" />
          ) : (
            <Chargement texte="Génération du PDF…" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Chargement({ texte }: { texte: string }) {
  return (
    <p className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {texte}
    </p>
  );
}
