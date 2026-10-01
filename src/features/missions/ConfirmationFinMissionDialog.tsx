import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Fin de mission rapide (2026-10-01) : moins de 15 min après le départ, ou
 * aucun kilomètre ni heure de fonctionnement. Le serveur la refuse en 422
 * « Saisie à confirmer » ; l'utilisateur corrige le relevé, ou confirme en
 * connaissance de cause (la fin est alors inscrite au journal d'audit avec
 * ses motifs).
 */
export function ConfirmationFinMissionDialog({
  points,
  enCours,
  onCorriger,
  onConfirmer,
}: {
  points: string[] | null;
  enCours: boolean;
  onCorriger: () => void;
  onConfirmer: () => void;
}) {
  return (
    <Dialog open={points !== null} onOpenChange={(o) => !o && onCorriger()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-badge-warningFg" aria-hidden="true" />
            Fin de mission à vérifier
          </DialogTitle>
          <DialogDescription>Cette mission semble se terminer juste après son départ.</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {(points ?? []).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Si la mission a réellement eu lieu ainsi (trajet très court, véhicule resté sur place), terminez-la : la fin est
          inscrite au journal d'audit avec ces motifs. Si elle n'a pas eu lieu, demandez plutôt son annulation au
          responsable du parc.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCorriger}>
            Corriger
          </Button>
          <Button type="button" onClick={onConfirmer} disabled={enCours}>
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            Terminer quand même
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
