import type { ReactNode } from "react";

/**
 * En-tête du tableau de bord : salutation, date du jour et actions rapides
 * (seulement celles autorisées pour le rôle, calculées par la page).
 */
export function EnTeteTableauBord({
  salutation,
  date,
  actions,
  sousTitre,
}: {
  salutation: string;
  date: string;
  actions: ReactNode;
  /** Ligne sous la salutation (tableau de bord de direction : actualisation et « En direct », 2026-09-30). */
  sousTitre?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm capitalize text-muted-foreground">{date}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{salutation}</h1>
        {sousTitre && <div className="mt-1">{sousTitre}</div>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}
