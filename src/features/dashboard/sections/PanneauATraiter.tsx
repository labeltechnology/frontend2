import { Link } from "react-router-dom";
import { ChevronRight, ListTodo } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { ElementATraiter, Urgence } from "@/features/dashboard/indicateurs";
import { cn } from "@/lib/utils";

const PRESENTATION_URGENCE: Record<Urgence, { libelle: string; pastille: string; point: string }> = {
  critique: { libelle: "Critique", pastille: "bg-badge-dangerBg text-badge-dangerFg", point: "bg-badge-dangerFg" },
  elevee: { libelle: "Urgent", pastille: "bg-badge-warningBg text-badge-warningFg", point: "bg-badge-warningFg" },
  moyenne: { libelle: "À prévoir", pastille: "bg-badge-infoBg text-badge-infoFg", point: "bg-badge-infoFg" },
};

const NOMBRE_VISIBLE = 7;

/**
 * « À traiter » : la liste de travail du jour, du plus urgent au moins urgent
 * (alertes, incidents, documents, retours de mission, pannes). Chaque ligne
 * ouvre la page où l'on peut agir. L'urgence est donnée par la couleur ET un
 * libellé (jamais la couleur seule).
 */
export function PanneauATraiter({
  elements,
  enChargement,
  sourcesIndisponibles,
}: {
  elements: ElementATraiter[];
  enChargement: boolean;
  /** Sources non chargées (droits, réseau) : signalées sous la liste. */
  sourcesIndisponibles: string[];
}) {
  const visibles = elements.slice(0, NOMBRE_VISIBLE);
  const restants = elements.length - visibles.length;
  const critiques = elements.filter((e) => e.urgence === "critique").length;

  return (
    <CadreSection
      titre="À traiter"
      icone={ListTodo}
      actions={
        elements.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {elements.length}
            {critiques > 0 && <span className="text-badge-dangerFg"> · {critiques} critique{critiques > 1 ? "s" : ""}</span>}
          </span>
        )
      }
    >
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : elements.length === 0 ? (
        <EtatBloc>Rien à traiter : tout est en ordre.</EtatBloc>
      ) : (
        <ul className="-mx-2 divide-y divide-border">
          {visibles.map((e) => {
            const p = PRESENTATION_URGENCE[e.urgence];
            return (
              <li key={e.cle}>
                <Link
                  to={e.lien}
                  className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", p.point)} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{e.titre}</span>
                      <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", p.pastille)}>{p.libelle}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {e.categorie} · {e.detail}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {restants > 0 && <p className="mt-2 text-xs text-muted-foreground">Et {restants} autre{restants > 1 ? "s" : ""} élément{restants > 1 ? "s" : ""} moins urgent{restants > 1 ? "s" : ""}.</p>}
      {sourcesIndisponibles.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">Non vérifié (accès ou chargement impossible) : {sourcesIndisponibles.join(", ")}.</p>
      )}
    </CadreSection>
  );
}
