import { libelleMois, maximumGraphe, SERIES, texteValeur, type PointPrevision, type SeriePrevision } from "@/features/couts/previsions";
import { cn } from "@/lib/utils";

/**
 * Graphe des prévisions : barres pleines = réel, barres claires = projection
 * (mois en cours : projection du mois entier derrière le réel partiel),
 * ligne = moyenne mobile sur 3 mois, trait horizontal = budget carburant.
 * Valeurs au survol et au clavier ; tableau pour les lecteurs d'écran.
 */
export function GraphePrevisions({ points, serie }: { points: PointPrevision[]; serie: SeriePrevision }) {
  const max = maximumGraphe(points);
  const n = points.length;
  const aBudget = points.some((p) => p.budget !== null);
  const ligne = points
    .map((p, i) => (p.moyenne === null ? null : `${i + 0.5},${100 - (p.moyenne / max) * 100}`))
    .reduce<string[][]>((segments, pt) => {
      if (pt === null) segments.push([]);
      else segments[segments.length - 1].push(pt);
      return segments;
    }, [[]])
    .filter((s) => s.length > 1);
  const titre = `${SERIES[serie].libelle} par mois : réel et projection`;

  return (
    <figure className="rounded-xl border bg-card p-4 shadow-sm">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-semibold">{titre}</span>
        <span className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Réel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-primary bg-primary/25" /> Projection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-badge-warningFg" /> Moyenne sur 3 mois
          </span>
          {aBudget && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-foreground" /> Budget
            </span>
          )}
        </span>
      </figcaption>
      <div className="relative mt-4 h-52" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-5 top-0 flex items-end gap-[2px] sm:gap-1">
          {points.map((p) => (
            <div key={p.mois} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0}>
              {p.projection !== null && (
                <span
                  className="absolute bottom-0 w-3/4 max-w-4 rounded-t border border-b-0 border-dashed border-primary/70 bg-primary/20"
                  style={{ height: `${(p.projection / max) * 100}%` }}
                />
              )}
              {p.reel !== null && (
                <span
                  className={cn("relative w-3/4 max-w-4 rounded-t", p.nature === "EN_COURS" ? "bg-primary/70" : "bg-primary")}
                  style={{ height: `${(p.reel / max) * 100}%` }}
                />
              )}
              {p.budget !== null && (
                <span className="absolute left-0 right-0 h-0.5 bg-foreground" style={{ bottom: `${(p.budget / max) * 100}%` }} />
              )}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-48 -translate-x-1/2 rounded-md border bg-popover px-2 py-1.5 text-xs shadow-md group-hover:block group-focus:block">
                <span className="block font-medium">
                  {libelleMois(p.mois)}
                  {p.nature === "EN_COURS" ? " (en cours)" : p.nature === "PROJECTION" ? " (projection)" : ""}
                </span>
                {p.reel !== null && <span className="block tabular-nums">Réel : {texteValeur(p.reel, serie)}</span>}
                {p.projection !== null && <span className="block tabular-nums">Projection : {texteValeur(p.projection, serie)}</span>}
                {p.moyenne !== null && <span className="block tabular-nums">Moyenne 3 mois : {texteValeur(p.moyenne, serie)}</span>}
                {p.budget !== null && <span className="block tabular-nums">Budget : {texteValeur(p.budget, serie)}</span>}
              </span>
            </div>
          ))}
        </div>
        <svg className="pointer-events-none absolute inset-x-0 bottom-5 top-0 h-[calc(100%-1.25rem)] w-full" viewBox={`0 0 ${n} 100`} preserveAspectRatio="none">
          {ligne.map((segment, i) => (
            <polyline
              key={i}
              points={segment.join(" ")}
              fill="none"
              className="stroke-badge-warningFg"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex h-5 gap-[2px] sm:gap-1">
          {points.map((p, i) => (
            <span key={p.mois} className="flex-1 truncate text-center text-[10px] text-muted-foreground">
              {i % 3 === 0 || p.nature === "EN_COURS" ? p.libelle : ""}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{titre}</caption>
        <thead>
          <tr>
            <th>Mois</th>
            <th>Réel</th>
            <th>Projection</th>
            <th>Moyenne sur 3 mois</th>
            {aBudget && <th>Budget</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.mois}>
              <td>{libelleMois(p.mois)}</td>
              <td>{texteValeur(p.reel, serie)}</td>
              <td>{texteValeur(p.projection, serie)}</td>
              <td>{texteValeur(p.moyenne, serie)}</td>
              {aBudget && <td>{texteValeur(p.budget, serie)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
