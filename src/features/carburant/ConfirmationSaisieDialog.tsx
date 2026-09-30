import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api-client";

/** Réponse 422 « Saisie à confirmer » du serveur (qualité des saisies, 2026-09-29). */
export function estSaisieAConfirmer(e: unknown): e is ApiError {
  return e instanceof ApiError && e.statut === 422;
}

/**
 * Saisie douteuse (distance impossible, compteur horaire, saisie antidatée) :
 * l'utilisateur corrige, ou confirme en connaissance de cause — une alerte
 * « Saisie à vérifier » est alors créée pour le responsable du parc.
 */
export function ConfirmationSaisieDialog({
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
            Saisie à vérifier
          </DialogTitle>
          <DialogDescription>Ces valeurs semblent incohérentes avec les saisies précédentes du véhicule.</DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {(points ?? []).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Si la saisie est juste (compteur remplacé, oubli de saisie), enregistrez-la : le responsable du parc recevra une alerte pour
          vérification.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCorriger}>
            Corriger
          </Button>
          <Button type="button" onClick={onConfirmer} disabled={enCours}>
            {enCours && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer quand même
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
