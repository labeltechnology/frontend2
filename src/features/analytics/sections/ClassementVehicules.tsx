import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { LigneClassement } from "@/features/analytics/agregats";
import { identifiantVehicule } from "@/lib/vehicule";

/**
 * Classement des véhicules sur une mesure (ex. les plus coûteux) : barre
 * proportionnelle au premier, valeur écrite, clic = rapport du véhicule.
 */
export function ClassementVehicules({ titre, lignes, formater }: { titre: string; lignes: LigneClassement[]; formater: (v: number) => string }) {
  const max = lignes[0]?.valeur ?? 0;
  return (
    <CadreSection titre={titre} icone={Trophy}>
      {lignes.length === 0 ? (
        <EtatBloc>Aucune dépense sur la période.</EtatBloc>
      ) : (
        <ol className="space-y-2.5">
          {lignes.map((l, i) => (
            <li key={l.engin.idEngin}>
              <Link to={`/engins/${l.engin.idEngin}/rapport`} className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="mr-1.5 text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
                    <span className="font-medium text-foreground group-hover:underline">{identifiantVehicule(l.engin)}</span>
                    <span className="text-muted-foreground"> · {l.engin.marque} {l.engin.modele}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-foreground">{formater(l.valeur)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${max > 0 ? (l.valeur / max) * 100 : 0}%` }} />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </CadreSection>
  );
}
