import { ArrowRight, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SchemaAide } from "@/types/aide";

const TONS: Record<NonNullable<SchemaAide["etapes"][number]["ton"]>, string> = {
  NEUTRE: "border-badge-infoFg/50 bg-badge-infoBg text-badge-infoFg",
  POSITIF: "border-badge-successFg/50 bg-badge-successBg text-badge-successFg",
  ATTENTION: "border-badge-warningFg/50 bg-badge-warningBg text-badge-warningFg",
  CRITIQUE: "border-badge-dangerFg/50 bg-badge-dangerBg text-badge-dangerFg",
};

/**
 * Schéma de l'aide (étape 5) en HTML : chaîne d'étapes fléchée, ou états
 * sans ordre. Lisible en thème sombre et au lecteur d'écran (liste ordonnée).
 */
export function SchemaAideVue({ schema }: { schema: SchemaAide }) {
  const Liste = schema.forme === "CHAINE" ? "ol" : "ul";
  return (
    <figure className="rounded-lg border border-border bg-muted/30 p-4" aria-label={schema.titre}>
      <figcaption className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{schema.titre}</figcaption>
      <Liste className={cn("flex flex-wrap items-stretch gap-2", schema.forme === "ETATS" && "grid grid-cols-2 sm:grid-cols-3")}>
        {schema.etapes.map((etape, i) => (
          <li key={`${etape.libelle}-${i}`} className="flex items-center gap-2">
            <div
              className={cn(
                "min-w-[7rem] rounded-md border px-3 py-2",
                etape.ton ? TONS[etape.ton] : "border-border bg-card text-foreground",
                schema.forme === "ETATS" && "w-full",
              )}
            >
              <p className="text-sm font-semibold">{etape.libelle}</p>
              {etape.note && <p className="text-xs opacity-80">{etape.note}</p>}
            </div>
            {schema.forme === "CHAINE" && i < schema.etapes.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
          </li>
        ))}
      </Liste>
      {schema.sorties?.map((sortie) => (
        <p key={sortie.vers + sortie.depuis} className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Depuis <strong className="text-foreground">{sortie.depuis}</strong> → <strong className="text-foreground">{sortie.vers}</strong> :{" "}
            {sortie.note}
          </span>
        </p>
      ))}
      {schema.legende && <p className="mt-2 text-xs italic text-muted-foreground">{schema.legende}</p>}
    </figure>
  );
}
