import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { accessible } from "@/features/aide/centre-aide";
import { iconeAide } from "@/features/aide/icones-aide";
import { cheminPage } from "@/features/aide/liens-aide";
import { cn } from "@/lib/utils";
import type { RoleLibelle } from "@/types/auth";
import type { PageAide, RubriqueAide } from "@/types/aide";

interface SommaireAideProps {
  centre: RubriqueAide[];
  idPageCourante: string | null;
  role: RoleLibelle | undefined;
  /** Masquer les tâches que le rôle ne peut pas faire. */
  seulementMesTaches: boolean;
  responsable: boolean;
  onNaviguer?: () => void;
}

/** Sommaire latéral (étape 6) : rubriques → sections → pages, la page courante ouverte. */
export function SommaireAide({ centre, idPageCourante, role, seulementMesTaches, responsable, onNaviguer }: SommaireAideProps) {
  const visible = (page: PageAide) =>
    (page.type !== "SUIVI" || responsable) && (!seulementMesTaches || page.type !== "GUIDE" || accessible(page, role));

  const lien = (page: PageAide) => (
    <li key={page.id}>
      <Link
        to={cheminPage(page.id)}
        onClick={onNaviguer}
        aria-current={page.id === idPageCourante ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
          page.id === idPageCourante ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-muted",
        )}
      >
        <span className="min-w-0 flex-1">{page.titre}</span>
        {!accessible(page, role) && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Réservé à d'autres rôles" />}
      </Link>
    </li>
  );

  return (
    <nav aria-label="Sommaire de l'aide" className="space-y-4">
      {centre.map((rubrique) => {
        const Icone = iconeAide(rubrique.icone);
        const pages = rubrique.pages.filter(visible);
        return (
          <div key={rubrique.id}>
            <Link
              to={`/aide?rubrique=${rubrique.id}`}
              onClick={onNaviguer}
              className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              <Icone className="h-3.5 w-3.5" aria-hidden="true" />
              {rubrique.titre}
            </Link>
            {pages.length > 0 && <ul className="space-y-0.5">{pages.map(lien)}</ul>}
            {rubrique.sections.map((section) => {
              const pagesSection = section.pages.filter(visible);
              if (pagesSection.length === 0) return null;
              const ouverte = pagesSection.some((p) => p.id === idPageCourante);
              return (
                <details key={section.id} open={ouverte} className="group">
                  <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-sm font-medium hover:bg-muted">
                    <span className="mr-1 inline-block text-muted-foreground transition group-open:rotate-90" aria-hidden="true">›</span>
                    {section.titre}
                  </summary>
                  <ul className="ml-3 space-y-0.5 border-l border-border pl-2">{pagesSection.map(lien)}</ul>
                </details>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
