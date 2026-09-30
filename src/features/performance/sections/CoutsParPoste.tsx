import { nombreFr, partsCouts } from "@/features/performance/performance";
import { cn } from "@/lib/utils";
import type { CoutsPerformance } from "@/types/performance";

/** Coût total de la période et sa répartition : carburant, maintenance, location entrante, incidents. */
export function CoutsParPoste({ couts }: { couts: CoutsPerformance }) {
  const parts = partsCouts(couts);
  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-couts">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titre-couts" className="font-display text-lg font-semibold">Coûts de la période</h2>
        <p className="font-display text-2xl font-bold tabular-nums">{nombreFr(couts.total)} Ar</p>
      </div>
      {couts.total > 0 ? (
        <>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            {parts.filter((p) => p.part > 0).map((p) => (
              <div key={p.cle} className={p.classe} style={{ width: `${p.part}%` }} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {parts.map((p) => (
              <li key={p.cle} className="flex items-center gap-2 text-sm">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", p.classe)} aria-hidden="true" />
                <span className="flex-1">{p.libelle}</span>
                <span className="tabular-nums font-medium">{nombreFr(p.montant)} Ar</span>
                <span className="w-14 text-right tabular-nums text-muted-foreground">{nombreFr(p.part, 1)} %</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Aucun coût enregistré sur la période.</p>
      )}
    </section>
  );
}
