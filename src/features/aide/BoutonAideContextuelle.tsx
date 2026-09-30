import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CircleHelp, LifeBuoy, ListChecks, MessageCircleQuestion } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/useAuth";
import { accessible, pagesPourChemin } from "@/features/aide/centre-aide";
import { CENTRE_AIDE } from "@/features/aide/contenu";
import { cheminPage } from "@/features/aide/liens-aide";
import { cn } from "@/lib/utils";
import type { PageAide } from "@/types/aide";

const ICONE_TYPE: Partial<Record<PageAide["type"], typeof ListChecks>> = {
  GUIDE: ListChecks,
  FAQ: MessageCircleQuestion,
  DEPANNAGE: LifeBuoy,
};

/**
 * Bouton « ? » de la barre de navigation (étape 6) : ouvre l'aide de la page
 * affichée — guides, questions et dépannage liés à cet écran — et un lien
 * vers le centre d'aide complet.
 */
export function BoutonAideContextuelle() {
  const [ouvert, setOuvert] = useState(false);
  const { pathname } = useLocation();
  const { session } = useAuth();
  const pages = useMemo(
    () => pagesPourChemin(CENTRE_AIDE, pathname).filter(({ page }) => page.type !== "GUIDE" || accessible(page, session?.role)),
    [pathname, session?.role],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title="Aide sur cette page"
        aria-label="Aide sur cette page"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-text transition-colors hover:bg-sidebar-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Aide sur cette page</SheetTitle>
            <SheetDescription>Les guides et réponses liés à l'écran affiché.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {pages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de guide pour cet écran. Cherchez dans le centre d'aide.</p>
            ) : (
              <ul className="space-y-2">
                {pages.map(({ page }) => {
                  const Icone = ICONE_TYPE[page.type] ?? CircleHelp;
                  return (
                    <li key={page.id}>
                      <Link
                        to={cheminPage(page.id)}
                        onClick={() => setOuvert(false)}
                        className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/60"
                      >
                        <Icone className={cn("mt-0.5 h-4 w-4 shrink-0", page.type === "DEPANNAGE" ? "text-badge-warningFg" : "text-primary")} aria-hidden="true" />
                        <span>
                          <span className="block text-sm font-medium">{page.titre}</span>
                          <span className="block text-xs text-muted-foreground">{page.resume}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              to="/aide"
              onClick={() => setOuvert(false)}
              className="flex items-center justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Ouvrir le centre d'aide
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
