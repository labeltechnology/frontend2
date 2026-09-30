import { ArrowRight } from "lucide-react";
import { FAMILLES, rapportsDeLaFamille } from "@/features/rapports/catalogue";
import { ICONES_RAPPORT, TEINTE_FAMILLE } from "@/features/rapports/presentation-rapport";
import { cn } from "@/lib/utils";
import type { TypeRapport } from "@/types/rapport";

/**
 * Choix du type de rapport en cartes, rangées par famille (2026-09-28) :
 * icône, titre et une phrase qui dit ce que contient le rapport.
 */
export function CatalogueRapports({ onChoisir }: { onChoisir: (type: TypeRapport) => void }) {
  return (
    <div className="space-y-5">
      {FAMILLES.map((famille) => (
        <section key={famille.cle} aria-labelledby={`famille-${famille.cle}`}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 id={`famille-${famille.cle}`} className="font-display text-sm font-semibold">
              {famille.libelle}
            </h3>
            <span className="text-xs text-muted-foreground">{famille.description}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {rapportsDeLaFamille(famille.cle).map((def) => {
              const Icone = ICONES_RAPPORT[def.icone];
              return (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => onChoisir(def.type)}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", TEINTE_FAMILLE[def.famille])}>
                    <Icone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {def.titre}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{def.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
