import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAnnulerChantier } from "@/features/chantiers/api";
import { useRafraichirApresStatut } from "@/features/chantiers/suivi-api";
import { MOTIF_ANNULATION_MAX, problemeMotifAnnulation } from "@/features/chantiers/suivi/synthese-chantiers";
import { ApiError } from "@/lib/api-client";
import type { Chantier } from "@/types/chantier";

/**
 * Annulation d'un chantier (2026-09-29) — remplace window.prompt : motif
 * obligatoire, 255 caractères maximum (même règle que le serveur). Les
 * véhicules et conducteurs encore rattachés sont libérés par le serveur.
 */
export function AnnulerChantierDialog({
  chantier,
  onOpenChange,
}: {
  chantier: Chantier | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [motif, setMotif] = useState("");
  const [tente, setTente] = useState(false);
  const annuler = useAnnulerChantier();
  const rafraichir = useRafraichirApresStatut();

  useEffect(() => {
    if (chantier) {
      setMotif("");
      setTente(false);
    }
  }, [chantier]);

  const probleme = problemeMotifAnnulation(motif);

  const valider = async () => {
    setTente(true);
    if (!chantier || probleme) return;
    try {
      await annuler.mutateAsync({ id: chantier.idChantier, motifAnnulation: motif.trim() });
      rafraichir();
      toast.success("Chantier annulé — ses véhicules et conducteurs sont libérés");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Annulation impossible");
    }
  };

  return (
    <Dialog open={chantier !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler le chantier</DialogTitle>
          <DialogDescription>
            {chantier?.nom} — l'annulation est définitive ; les véhicules et conducteurs rattachés seront libérés.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motif-annulation-chantier">Motif de l'annulation</Label>
          <Textarea
            id="motif-annulation-chantier"
            rows={3}
            value={motif}
            maxLength={MOTIF_ANNULATION_MAX + 20}
            onChange={(e) => setMotif(e.target.value)}
            aria-invalid={tente && probleme !== null}
          />
          <div className="flex justify-between text-xs">
            <span className="text-destructive">{tente ? probleme : null}</span>
            <span className={motif.trim().length > MOTIF_ANNULATION_MAX ? "text-destructive" : "text-muted-foreground"}>
              {motif.trim().length} / {MOTIF_ANNULATION_MAX}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Retour
          </Button>
          <Button type="button" variant="destructive" onClick={valider} disabled={annuler.isPending}>
            {annuler.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Annuler le chantier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
