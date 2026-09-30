import { Link } from "react-router-dom";
import { Gauge } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { ConsommationVehicule } from "@/features/analytics/agregats";
import { formatNombre } from "@/lib/utils";
import { identifiantVehicule } from "@/lib/vehicule";

const NOMBRE_VISIBLE = 6;

/**
 * Consommation par véhicule routier (L/100 km) sur la période, du plus
 * gourmand au plus sobre, avec la moyenne de la flotte en repère : un
 * véhicule au-dessus de 120 % de la moyenne est signalé « à surveiller ».
 */
export function ConsommationVehicules({ lignes, moyenne }: { lignes: ConsommationVehicule[]; moyenne: number | null }) {
  const visibles = lignes.slice(0, NOMBRE_VISIBLE);
  const max = Math.max(...visibles.map((l) => l.litresAux100), moyenne ?? 0, 0);
  return (
    <CadreSection titre="Consommation par véhicule" icone={Gauge} lien="/carburant">
      {lignes.length === 0 ? (
        <EtatBloc>Pas assez de pleins sur la période (2 par véhicule au minimum).</EtatBloc>
      ) : (
        <div className="space-y-3">
          {moyenne !== null && (
            <p className="text-xs text-muted-foreground">
              Moyenne de la flotte : <span className="font-semibold text-foreground">{formatNombre(moyenne, 1)} L/100 km</span>
            </p>
          )}
          <ul className="space-y-2.5">
            {visibles.map((l) => {
              const aSurveiller = moyenne !== null && l.litresAux100 > moyenne * 1.2;
              return (
                <li key={l.engin.idEngin}>
                  <Link to={`/engins/${l.engin.idEngin}/rapport`} className="group block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-foreground group-hover:underline">{identifiantVehicule(l.engin)}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {aSurveiller && <span className="rounded bg-badge-warningBg px-1.5 py-0.5 text-[10px] font-semibold uppercase text-badge-warningFg">À surveiller</span>}
                        <span className="font-semibold tabular-nums text-foreground">{formatNombre(l.litresAux100, 1)} L/100</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full rounded-full bg-muted">
                      <div className={aSurveiller ? "h-full rounded-full bg-badge-warningFg" : "h-full rounded-full bg-primary"} style={{ width: `${max > 0 ? (l.litresAux100 / max) * 100 : 0}%` }} />
                      {moyenne !== null && max > 0 && (
                        <span className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-foreground/60" style={{ left: `${(moyenne / max) * 100}%` }} aria-hidden />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {lignes.length > NOMBRE_VISIBLE && <p className="text-xs text-muted-foreground">+ {lignes.length - NOMBRE_VISIBLE} autre(s) véhicule(s).</p>}
        </div>
      )}
    </CadreSection>
  );
}
