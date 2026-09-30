import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { BoutonFavori } from "@/components/layout/favoris/BoutonFavori";
import { cliquerNouveau } from "@/components/layout/raccourcis/actions-page";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

const ESSAIS_NOUVEAU = 10;

/**
 * En-tête standard de chaque page de module : titre, sous-titre optionnel, actions à droite (ex. bouton "Nouveau").
 *
 * Ergonomie (2026-09-30) : étoile des favoris à côté du titre ; les actions
 * portent `data-actions-page` (raccourci N) ; `?action=nouveau` dans
 * l'adresse (actions rapides de la recherche globale) ouvre la création dès
 * que le bouton est prêt, puis l'adresse est nettoyée.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  const [parametres, setParametres] = useSearchParams();
  const demandeNouveau = parametres.get("action") === "nouveau";

  useEffect(() => {
    if (!demandeNouveau) return;
    let essais = 0;
    const id = window.setInterval(() => {
      essais += 1;
      if (cliquerNouveau() || essais >= ESSAIS_NOUVEAU) {
        window.clearInterval(id);
        const suite = new URLSearchParams(parametres);
        suite.delete("action");
        setParametres(suite, { replace: true });
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [demandeNouveau, parametres, setParametres]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <BoutonFavori />
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && (
        <div data-actions-page className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
