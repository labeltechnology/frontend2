import { AlertTriangle } from "lucide-react";

/**
 * Bandeau « Modifications non enregistrées » (2026-09-30), affiché en haut
 * d'une fiche dès qu'un champ a changé. Rappelle Ctrl+S ; quitter la page
 * demande confirmation (useGardeModifications).
 */
export function BandeauNonEnregistre({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div role="status" className="flex items-center gap-3 rounded-lg border border-primary bg-badge-warningBg px-4 py-2.5 text-sm text-foreground">
      <AlertTriangle className="h-4 w-4 shrink-0 text-badge-warningFg" aria-hidden="true" />
      <span>
        <strong>Modifications non enregistrées.</strong> Enregistrez avec le bouton en bas de la fiche ou <kbd className="rounded border px-1 text-xs">Ctrl</kbd>+
        <kbd className="rounded border px-1 text-xs">S</kbd>.
      </span>
    </div>
  );
}
