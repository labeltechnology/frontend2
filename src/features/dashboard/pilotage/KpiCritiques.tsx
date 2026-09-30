import { useState } from "react";
import { Link } from "react-router-dom";
import { Gauge, Settings2 } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { ReglageKpiDialog } from "@/features/dashboard/pilotage/ReglageKpiDialog";
import {
  PRESENTATION_ETAT_KPI,
  classeTendance,
  texteCible,
  texteTendance,
  texteValeurKpi,
} from "@/features/dashboard/pilotage/pilotage";
import { cn } from "@/lib/utils";
import type { KpiPilotage } from "@/types/pilotage";

/**
 * « KPI critiques » (2026-09-30) : 6 indicateurs avec cible, seuil d'alerte,
 * état (couleur ET libellé) et tendance face à la période précédente. La
 * carte mène à la page détaillée ; le bouton ⚙ règle l'objectif et le seuil.
 */
export function KpiCritiques({
  kpis,
  enChargement,
  enErreur,
  peutRegler,
}: {
  kpis: KpiPilotage[] | undefined;
  enChargement: boolean;
  enErreur: boolean;
  peutRegler: boolean;
}) {
  const [enReglage, setEnReglage] = useState<KpiPilotage | null>(null);
  const alertes = (kpis ?? []).filter((k) => k.etat === "CRITIQUE").length;
  const aSurveiller = (kpis ?? []).filter((k) => k.etat === "A_SURVEILLER").length;

  return (
    <CadreSection
      titre="KPI critiques"
      icone={Gauge}
      lien="/performance"
      libelleLien="Performance détaillée"
      actions={
        kpis && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {alertes > 0 && <span className="text-badge-dangerFg">{alertes} en alerte · </span>}
            {aSurveiller > 0 && <span className="text-badge-warningFg">{aSurveiller} à surveiller · </span>}
            {kpis.length - alertes - aSurveiller} autres
          </span>
        )
      }
    >
      {enChargement ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : enErreur || !kpis ? (
        <EtatBloc erreur>Impossible de calculer les KPI.</EtatBloc>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {kpis.map((k) => (
            <CarteKpi key={k.code} kpi={k} peutRegler={peutRegler} onRegler={() => setEnReglage(k)} />
          ))}
        </div>
      )}
      <ReglageKpiDialog kpi={enReglage} onFermer={() => setEnReglage(null)} />
    </CadreSection>
  );
}

function CarteKpi({ kpi, peutRegler, onRegler }: { kpi: KpiPilotage; peutRegler: boolean; onRegler: () => void }) {
  const etat = PRESENTATION_ETAT_KPI[kpi.etat];
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className={cn("absolute inset-x-0 top-0 h-1", etat.lisere)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <Link
          to={kpi.lien}
          title={kpi.definition}
          className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {kpi.libelle}
        </Link>
        {peutRegler && (
          <button
            type="button"
            onClick={onRegler}
            className="rounded p-0.5 text-muted-foreground opacity-60 transition-opacity hover:text-foreground hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Régler l'objectif et le seuil : ${kpi.libelle}`}
            title="Régler l'objectif et le seuil d'alerte"
          >
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{texteValeurKpi(kpi.valeur, kpi.unite)}</p>
      <p className={cn("text-xs font-medium tabular-nums", classeTendance(kpi.tendance.amelioration))} title={kpi.periode}>
        {texteTendance(kpi)}
        {kpi.valeurPrecedente !== null && (
          <span className="font-normal text-muted-foreground"> (avant : {texteValeurKpi(kpi.valeurPrecedente, kpi.unite)})</span>
        )}
      </p>
      <span className={cn("mt-2 w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", etat.classe)}>{etat.libelle}</span>
      <p className="mt-1 text-xs text-muted-foreground">{texteCible(kpi)}</p>
      {kpi.precision && <p className="mt-0.5 text-xs text-muted-foreground">{kpi.precision}</p>}
    </div>
  );
}
