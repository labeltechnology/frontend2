import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Chiffre clé de la page Coûts et rentabilité : libellé, valeur, précision facultative. */
export function CarteChiffre({
  titre,
  valeur,
  precision,
  classeValeur,
}: {
  titre: string;
  valeur: ReactNode;
  precision?: ReactNode;
  classeValeur?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{titre}</p>
      <p className={cn("mt-1 font-display text-xl font-bold tabular-nums", classeValeur)}>{valeur}</p>
      {precision && <p className="mt-1 text-xs text-muted-foreground">{precision}</p>}
    </div>
  );
}
