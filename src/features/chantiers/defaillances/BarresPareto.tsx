import { largeursPareto } from "@/features/chantiers/defaillances/defaillances";
import { formatMontant } from "@/lib/utils";
import type { LignePareto } from "@/types/chantier";

/** Pareto des causes de défaillance : une barre par cause, part et part cumulée (V64). */
export function BarresPareto({ lignes }: { lignes: LignePareto[] }) {
  if (lignes.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune défaillance avec une cause renseignée.</p>;
  }
  const largeurs = largeursPareto(lignes);
  return (
    <ul className="space-y-2">
      {lignes.map((l, i) => (
        <li key={l.cause} className="space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <span>{l.libelle}</span>
            <span className="text-muted-foreground">
              {l.nombre} · {l.part} % (cumul {l.partCumulee} %) · {formatMontant(l.cout)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden>
            <div className="h-2 rounded-full bg-primary" style={{ width: `${largeurs[i]}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
