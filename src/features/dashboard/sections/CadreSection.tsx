import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Cadre commun des blocs du tableau de bord : titre avec pictogramme, lien
 * « Voir tout » vers la page du module, contenu. Un seul style pour tous les
 * blocs (cohérence visuelle).
 */
export function CadreSection({
  titre,
  icone: Icone,
  lien,
  libelleLien = "Voir tout",
  actions,
  className,
  children,
}: {
  titre: string;
  icone: LucideIcon;
  lien?: string;
  libelleLien?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col p-4 sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icone className="h-4 w-4 text-muted-foreground" aria-hidden />
          {titre}
        </h2>
        <div className="flex items-center gap-2">
          {actions}
          {lien && (
            <Link
              to={lien}
              className="group inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {libelleLien}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </Card>
  );
}

/** Message d'état d'un bloc (chargement, erreur, vide). */
export function EtatBloc({ children, erreur }: { children: ReactNode; erreur?: boolean }) {
  return <p className={cn("py-6 text-center text-sm", erreur ? "text-destructive" : "text-muted-foreground")}>{children}</p>;
}
