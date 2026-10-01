import { Fragment, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useDetailFilAriane } from "@/components/layout/fil-ariane/ContexteFilAriane";
import { cheminRetour, segmentsAriane } from "@/components/layout/fil-ariane/fil-ariane";
import { noterPageRecente } from "@/components/layout/favoris/useFavoris";
import { NAV_ITEMS } from "@/routes/nav-config";
import { entreesVisibles } from "@/routes/navigation-groupes";

/**
 * Fil d'Ariane et bouton retour, en tête de chaque page sauf le tableau de
 * bord (2026-09-30). Le retour mène à la liste, qui retrouve ses filtres.
 * Note aussi la page parmi les récentes (menu ★).
 */
export function FilAriane() {
  const { pathname, search } = useLocation();
  const { session } = useAuth();
  const detail = useDetailFilAriane();
  const items = entreesVisibles(NAV_ITEMS, session?.role);
  const segments = segmentsAriane(pathname, items, detail);
  const retour = cheminRetour(pathname, items);

  const titre = segments.length > 1 ? segments.slice(1).map((s) => s.libelle).join(" › ") : segments[0]?.libelle;
  useEffect(() => {
    if (titre && !/› Nouveau$/.test(titre)) noterPageRecente({ chemin: pathname + search, libelle: titre });
  }, [titre, pathname, search]);

  if (segments.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {retour && (
        <Link
          to={retour.chemin}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Retour à la liste (Alt+←), filtres conservés"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {retour.libelle}
        </Link>
      )}
      <nav aria-label="Fil d'Ariane">
        <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          {segments.map((s, i) => (
            <Fragment key={`${i}-${s.libelle}`}>
              {i > 0 && (
                <li aria-hidden="true">
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </li>
              )}
              <li>
                {s.chemin ? (
                  <Link to={s.chemin} className="hover:text-foreground hover:underline">
                    {s.libelle}
                  </Link>
                ) : (
                  <span aria-current={i === segments.length - 1 ? "page" : undefined} className={i === segments.length - 1 ? "text-foreground" : undefined}>
                    {s.libelle}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    </div>
  );
}
