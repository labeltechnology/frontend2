import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Indicateur chiffré avec son écart par rapport à la période précédente.
 * Couleur de l'écart selon le sens souhaitable de la mesure : une hausse de
 * coût est rouge, une baisse verte ; pour une mesure neutre (km, missions),
 * l'écart reste gris. Toujours flèche + texte (jamais la couleur seule).
 */
export function CarteKpi({
  titre,
  valeur,
  ecart,
  hausseSouhaitable,
  precision,
}: {
  titre: string;
  valeur: string;
  ecart: number | null;
  hausseSouhaitable: boolean | null;
  precision?: string;
}) {
  const hausse = ecart !== null && ecart > 0.05;
  const baisse = ecart !== null && ecart < -0.05;
  const bon = hausseSouhaitable === null ? null : hausseSouhaitable ? hausse : baisse;
  const mauvais = hausseSouhaitable === null ? null : hausseSouhaitable ? baisse : hausse;
  const Fleche = hausse ? ArrowUpRight : baisse ? ArrowDownRight : Minus;
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{titre}</p>
      <p className="mt-1 font-display text-xl font-bold tabular-nums text-foreground">{valeur}</p>
      <p className="mt-1 flex items-center gap-1 text-xs">
        {ecart === null ? (
          <span className="text-muted-foreground">{precision ?? "Pas de période précédente à comparer"}</span>
        ) : (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
                bon ? "bg-badge-successBg text-badge-successFg" : mauvais ? "bg-badge-dangerBg text-badge-dangerFg" : "bg-badge-neutralBg text-badge-neutralFg",
              )}
            >
              <Fleche className="h-3 w-3" aria-hidden />
              {ecart > 0 ? "+" : ""}
              {ecart.toFixed(1)} %
            </span>
            <span className="text-muted-foreground">vs période précédente</span>
          </>
        )}
      </p>
    </div>
  );
}
