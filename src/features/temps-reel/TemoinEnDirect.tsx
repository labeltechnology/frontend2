import { useSyncExternalStore } from "react";
import { etatTempsReel, suivreEtatTempsReel, type EtatTempsReel } from "@/lib/temps-reel/etat";
import { cn } from "@/lib/utils";

const PRESENTATION: Record<EtatTempsReel, { classe: string; texte: string }> = {
  "en-direct": { classe: "bg-badge-successFg", texte: "En direct : les modifications des autres utilisateurs s'affichent tout de suite" },
  connexion: { classe: "bg-badge-warningFg animate-pulse", texte: "Reconnexion au direct en cours…" },
  "hors-ligne": { classe: "bg-muted-foreground/60", texte: "Direct indisponible : les écrans se mettent à jour à chaque visite" },
};

/**
 * Témoin « En direct » (2026-09-29) : pastille verte quand la connexion temps
 * réel est active, orange pendant une reconnexion, grise sinon.
 */
export function TemoinEnDirect({ className }: { className?: string }) {
  const etat = useSyncExternalStore(suivreEtatTempsReel, etatTempsReel, etatTempsReel);
  const { classe, texte } = PRESENTATION[etat];
  return (
    <span
      role="status"
      title={texte}
      className={cn("block h-2.5 w-2.5 rounded-full ring-2 ring-background", classe, className)}
    >
      <span className="sr-only">{texte}</span>
    </span>
  );
}
