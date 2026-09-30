import type { LucideIcon } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { Part } from "@/features/analytics/agregats";
import { formatMontant } from "@/lib/utils";

/**
 * Répartition simple (missions par statut, maintenances par type, incidents
 * par type) : une ligne par catégorie avec nombre, part du total et barre —
 * une seule couleur (la catégorie est donnée par le libellé, pas par une
 * couleur tirée au hasard).
 */
export function CarteRepartition({ titre, icone, lien, parts, avecMontant }: { titre: string; icone: LucideIcon; lien: string; parts: Part[]; avecMontant?: boolean }) {
  const total = parts.reduce((s, p) => s + p.nombre, 0);
  return (
    <CadreSection titre={titre} icone={icone} lien={lien}>
      {total === 0 ? (
        <EtatBloc>Aucune donnée sur la période.</EtatBloc>
      ) : (
        <ul className="space-y-2.5">
          {parts.map((p) => {
            const pct = total > 0 ? (p.nombre / total) * 100 : 0;
            return (
              <li key={p.cle}>
                <div className="mb-1 flex items-baseline gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.libelle}</span>
                  {avecMontant && p.montant !== undefined && p.montant > 0 && <span className="text-xs tabular-nums text-muted-foreground">{formatMontant(p.montant)}</span>}
                  <span className="font-semibold tabular-nums text-foreground">{p.nombre}</span>
                  <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{Math.round(pct)} %</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CadreSection>
  );
}
