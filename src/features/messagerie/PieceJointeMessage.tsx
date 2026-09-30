import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { telechargerPieceJointe, urlPieceJointe } from "@/features/messagerie/api";
import { tailleLisible } from "@/features/messagerie/messagerie";
import type { PieceJointe } from "@/types/messagerie";

/** Photo (vignette, clic = télécharger) ou document PDF (bouton de téléchargement). */
export function PieceJointeMessage({ pieceJointe }: { pieceJointe: PieceJointe }) {
  const [enCours, setEnCours] = useState(false);
  const telecharger = async () => {
    setEnCours(true);
    try {
      await telechargerPieceJointe(pieceJointe.idPieceJointe, pieceJointe.nom);
    } catch {
      toast.error("Téléchargement impossible");
    } finally {
      setEnCours(false);
    }
  };

  if (pieceJointe.image) {
    return (
      <button
        type="button"
        onClick={telecharger}
        title={`${pieceJointe.nom} — télécharger`}
        className="block overflow-hidden rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <AuthenticatedImage url={urlPieceJointe(pieceJointe.idPieceJointe)} alt={pieceJointe.nom} className="h-32 w-44" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={telecharger}
      className="flex max-w-60 items-center gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{pieceJointe.nom}</span>
        <span className="text-muted-foreground">{tailleLisible(pieceJointe.taille)}</span>
      </span>
      {enCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}
