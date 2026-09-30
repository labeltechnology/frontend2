import { NOMS_MOIS, texteEcartMontant, texteMontant } from "@/features/couts/couts";

/**
 * Budget et réel mois par mois : barres groupées (budget en gris, réel en
 * couleur), légende, valeurs au survol et au clavier, et tableau pour les
 * lecteurs d'écran. Un seul axe (Ar).
 */
export function GrapheBudgetMensuel({ mois }: { mois: { mois: number; budget: number; reel: number }[] }) {
  const max = Math.max(1, ...mois.flatMap((m) => [m.budget, m.reel]));
  return (
    <figure className="rounded-xl border bg-card p-4 shadow-sm">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-semibold">Budget et dépense réelle par mois</span>
        <span className="flex gap-4 text-xs text-muted-foreground" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" /> Budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Réel
          </span>
        </span>
      </figcaption>
      <div className="mt-4 flex h-44 items-end gap-1 sm:gap-2" aria-hidden="true">
        {mois.map((m) => (
          <div key={m.mois} className="group relative flex h-full flex-1 flex-col justify-end" tabIndex={0}>
            <div className="flex h-full items-end justify-center gap-[2px]">
              <span className="w-1/2 max-w-3 rounded-t bg-muted-foreground/40" style={{ height: `${(m.budget / max) * 100}%` }} />
              <span className="w-1/2 max-w-3 rounded-t bg-primary" style={{ height: `${(m.reel / max) * 100}%` }} />
            </div>
            <span className="mt-1 text-center text-[10px] text-muted-foreground">{NOMS_MOIS[m.mois - 1]}</span>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-40 -translate-x-1/2 rounded-md border bg-popover px-2 py-1.5 text-xs shadow-md group-hover:block group-focus:block">
              <span className="block font-medium">{NOMS_MOIS[m.mois - 1]}</span>
              <span className="block tabular-nums">Budget : {texteMontant(m.budget)}</span>
              <span className="block tabular-nums">Réel : {texteMontant(m.reel)}</span>
              {m.reel > 0 && <span className="block tabular-nums">Écart : {texteEcartMontant(m.reel - m.budget)}</span>}
            </span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Budget et dépense réelle par mois</caption>
        <thead>
          <tr>
            <th>Mois</th>
            <th>Budget</th>
            <th>Réel</th>
          </tr>
        </thead>
        <tbody>
          {mois.map((m) => (
            <tr key={m.mois}>
              <td>{NOMS_MOIS[m.mois - 1]}</td>
              <td>{texteMontant(m.budget)}</td>
              <td>{texteMontant(m.reel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
