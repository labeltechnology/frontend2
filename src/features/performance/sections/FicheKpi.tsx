import { useState } from "react";
import { Info, Pencil, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectifKpiDialog } from "@/features/performance/sections/ObjectifKpiDialog";
import { STATUTS_KPI, formaterValeurUnite, progressionObjectif } from "@/features/performance/performance";
import { cn } from "@/lib/utils";
import type { KpiParc } from "@/types/performance";

/**
 * Fiche « KPI du parc » : une carte par indicateur (valeur, objectif, jauge,
 * statut), le détail (définition, formule, fréquence) à la demande, et la
 * fiche complète en tableau.
 */
export function FicheKpi({ indicateurs, peutModifier }: { indicateurs: KpiParc[]; peutModifier: boolean }) {
  const [enEdition, setEnEdition] = useState<KpiParc | null>(null);
  const [ficheOuverte, setFicheOuverte] = useState(false);

  return (
    <section className="space-y-3" aria-labelledby="titre-kpi">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="titre-kpi" className="font-display text-lg font-semibold">KPI du parc</h2>
          <p className="text-sm text-muted-foreground">Valeur sur la période, comparée à l'objectif{peutModifier ? " (réglable)" : ""}.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setFicheOuverte((o) => !o)} aria-expanded={ficheOuverte}>
          <Info className="h-4 w-4" />
          {ficheOuverte ? "Masquer la fiche détaillée" : "Voir la fiche détaillée"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {indicateurs.map((k) => (
          <CarteKpiParc key={k.code} kpi={k} onModifier={peutModifier ? () => setEnEdition(k) : undefined} />
        ))}
      </div>

      {ficheOuverte && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <caption className="sr-only">Fiche KPI du parc</caption>
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Indicateur</th>
                <th className="px-3 py-2">Définition</th>
                <th className="px-3 py-2">Formule</th>
                <th className="px-3 py-2">Fréquence</th>
                <th className="px-3 py-2 text-right">Objectif</th>
                <th className="px-3 py-2 text-right">Valeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {indicateurs.map((k) => (
                <tr key={k.code} className="align-top">
                  <td className="px-3 py-2 font-medium">{k.libelle}</td>
                  <td className="px-3 py-2 text-muted-foreground">{k.definition}</td>
                  <td className="px-3 py-2 font-mono text-xs">{k.formule}</td>
                  <td className="px-3 py-2">{k.frequence}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{k.objectif === null ? "—" : formaterValeurUnite(k.objectif, k.unite)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formaterValeurUnite(k.valeur, k.unite)}
                    <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs font-medium", STATUTS_KPI[k.statut].classes)}>
                      {STATUTS_KPI[k.statut].libelle}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ObjectifKpiDialog kpi={enEdition} onOpenChange={(open) => !open && setEnEdition(null)} />
    </section>
  );
}

function CarteKpiParc({ kpi, onModifier }: { kpi: KpiParc; onModifier?: () => void }) {
  const [details, setDetails] = useState(false);
  const statut = STATUTS_KPI[kpi.statut];
  const progression = progressionObjectif(kpi);

  return (
    <article className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{kpi.libelle}</h3>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", statut.classes)}>{statut.libelle}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formaterValeurUnite(kpi.valeur, kpi.unite)}</p>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {progression !== null && <div className={cn("h-full rounded-full", statut.barre)} style={{ width: `${progression}%` }} />}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          {kpi.objectif === null ? "Pas d'objectif" : `Objectif ${kpi.sens === "BAISSE" ? "≤" : "≥"} ${formaterValeurUnite(kpi.objectif, kpi.unite)}`}
        </span>
        <span className="flex items-center gap-1">
          {onModifier && (
            <button type="button" onClick={onModifier} className="rounded p-1 hover:bg-muted hover:text-foreground" aria-label={`Modifier l'objectif : ${kpi.libelle}`}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setDetails((d) => !d)}
            className="rounded p-1 hover:bg-muted hover:text-foreground"
            aria-expanded={details}
            aria-label={`Définition : ${kpi.libelle}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      {details && (
        <dl className="mt-2 space-y-1 border-t pt-2 text-xs">
          <dt className="sr-only">Définition</dt>
          <dd>{kpi.definition}</dd>
          <dt className="font-medium text-muted-foreground">Formule</dt>
          <dd className="font-mono">{kpi.formule}</dd>
          <dt className="font-medium text-muted-foreground">Fréquence de suivi</dt>
          <dd>{kpi.frequence}</dd>
        </dl>
      )}
    </article>
  );
}
