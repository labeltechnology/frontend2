import { FileText } from "lucide-react";
import { BARRES_NEUTRES, CLASSES_TON } from "@/features/rapports/presentation-rapport";
import { cn, formatNombre } from "@/lib/utils";
import type { PresentationRapport, RepartitionRapport, SectionRapport } from "@/types/rapport";

/**
 * Aperçu lisible d'un rapport (2026-09-28) : même structure et mêmes couleurs
 * que le PDF — chiffres clés en cartes, répartitions en barres, listes de détail.
 * Données : GET /api/rapports/{id}/presentation.
 */
export function ApercuRapport({ presentation }: { presentation: PresentationRapport }) {
  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{presentation.titre}</h2>
          <p className="text-sm text-muted-foreground">{presentation.description}</p>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Informations du rapport">
          {presentation.infos.map((info) => (
            <li key={info.libelle} className="rounded-md border border-border border-l-4 border-l-primary bg-muted/40 px-3 py-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{info.libelle}</span>
              <span className="text-sm font-semibold">{info.valeur}</span>
            </li>
          ))}
          {presentation.dateGeneration && (
            <li className="rounded-md border border-border bg-muted/40 px-3 py-1.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Généré le</span>
              <span className="text-sm font-semibold">{presentation.dateGeneration}</span>
            </li>
          )}
        </ul>
      </header>

      {presentation.sections.length === 0 ? (
        <p className="flex items-center gap-2 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Aucune donnée pour ce rapport.
        </p>
      ) : (
        presentation.sections.map((section, index) => <BlocSection key={`${section.titre}-${index}`} section={section} />)
      )}
    </article>
  );
}

function BlocSection({ section }: { section: SectionRapport }) {
  const n = section.indicateurs.length;
  const colonnes = n === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : n <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 border-b border-border pb-1.5 font-display text-base font-semibold">
        <span className="h-4 w-1 rounded-full bg-primary" aria-hidden="true" />
        {section.titre}
      </h3>
      {n > 0 && (
        <div className={cn("grid gap-3", colonnes)}>
          {section.indicateurs.map((ind) => (
            <div key={ind.cle} className="relative overflow-hidden rounded-lg border border-border bg-card py-3 pl-5 pr-3">
              <span className={cn("absolute inset-y-0 left-0 w-1.5", CLASSES_TON[ind.ton].bande)} aria-hidden="true" />
              <p className="text-xs text-muted-foreground">{ind.libelle}</p>
              <p className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", CLASSES_TON[ind.ton].valeur)}>{ind.valeur}</p>
            </div>
          ))}
        </div>
      )}
      {section.repartitions.map((rep) => (
        <Barres key={rep.titre} repartition={rep} />
      ))}
      {section.listes.map((liste) => (
        <div key={liste.titre} className="space-y-1.5">
          <p className="text-sm font-semibold">
            {liste.titre} <span className="font-normal text-muted-foreground">({liste.elements.length})</span>
          </p>
          {liste.elements.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">Aucun élément</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {liste.elements.map((element, i) => (
                <li key={i} className="flex items-start gap-2 px-3 py-1.5 text-sm odd:bg-muted/30">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {element}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

function Barres({ repartition }: { repartition: RepartitionRapport }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{repartition.titre}</p>
        <p className="text-xs text-muted-foreground">Total : {formatNombre(repartition.total)}</p>
      </div>
      {repartition.elements.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">Aucune donnée</p>
      ) : (
        <ul className="space-y-1.5">
          {repartition.elements.map((e, i) => (
            <li key={e.libelle} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
              <span className="truncate">{e.libelle}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    e.ton === "NEUTRE" ? BARRES_NEUTRES[i % BARRES_NEUTRES.length] : CLASSES_TON[e.ton].barre,
                  )}
                  style={{ width: `${Math.max(e.valeur > 0 ? 2 : 0, e.part)}%` }}
                />
              </span>
              <span className="whitespace-nowrap text-xs font-semibold tabular-nums">
                {e.valeurFormatee} · {formatNombre(e.part, 1)} %
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
