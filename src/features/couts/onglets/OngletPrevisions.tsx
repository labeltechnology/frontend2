import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrevisions } from "@/features/couts/api-previsions";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { texteEcartMontant, texteMontant } from "@/features/couts/couts";
import { GraphePrevisions } from "@/features/couts/onglets/GraphePrevisions";
import {
  classeTendanceDepenses,
  ecartBudgetFinAnnee,
  libelleMois,
  pointsGraphe,
  SERIES,
  texteTendance,
  texteValeur,
  type SeriePrevision,
} from "@/features/couts/previsions";
import { EtatChargement } from "@/features/fiabilite/EtatChargement";
import { cn } from "@/lib/utils";
import type { TypeEngin } from "@/types/engin";

const TOUS = "tous";
const LISTE_SERIES = Object.keys(SERIES) as SeriePrevision[];

/**
 * Onglet « Prévisions » (2026-09-29, question du DG « tendances et
 * projections budget / km ») : 24 derniers mois réels, moyenne mobile sur
 * 3 mois et projection linéaire sur 12 mois, pour tout le parc ou un type ;
 * comparaison au budget carburant (tout le parc). Serveur : prevision/PrevisionService.
 */
export function OngletPrevisions({ actif, types }: { actif: boolean; types: TypeEngin[] }) {
  const [type, setType] = useState<string>(TOUS);
  const [serie, setSerie] = useState<SeriePrevision>("TOTAL");
  const idType = type === TOUS ? null : Number(type);
  const requete = usePrevisions(idType, actif);
  const p = requete.data;
  const points = useMemo(() => (p ? pointsGraphe(p, serie) : []), [p, serie]);

  const filtres = (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="h-9 w-56" aria-label="Type de véhicule">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TOUS}>Tout le parc</SelectItem>
          {types.map((t) => (
            <SelectItem key={t.idTypeEngin} value={String(t.idTypeEngin)}>
              {t.libelle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Série affichée">
        {LISTE_SERIES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={serie === s}
            onClick={() => setSerie(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              serie === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {SERIES[s].libelle}
          </button>
        ))}
      </div>
    </div>
  );

  if (!p) {
    return (
      <div className="space-y-5">
        {filtres}
        <EtatChargement enCours={requete.isPending} erreur={requete.error} />
      </div>
    );
  }

  const ecart = ecartBudgetFinAnnee(p);
  const annee = p.moisCourant.slice(0, 4);

  return (
    <div className="space-y-5">
      {filtres}

      {!p.projectionPossible && (
        <p className="rounded-xl border bg-badge-warningBg px-4 py-3 text-sm text-badge-warningFg">
          Pas assez d'historique pour projeter : il faut au moins 3 mois complets d'activité. Les moyennes restent affichées.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CarteChiffre
          titre="Tendance des dépenses"
          valeur={texteTendance(p.tendanceTotalPourcent)}
          classeValeur={classeTendanceDepenses(p.tendanceTotalPourcent)}
          precision={`Sur les ${p.nombreMoisTendance} derniers mois complets`}
        />
        <CarteChiffre
          titre="Dépenses des 12 prochains mois"
          valeur={texteMontant(p.projectionTotal12Mois)}
          precision={`Dont carburant : ${texteMontant(p.projectionCarburant12Mois)}`}
        />
        <CarteChiffre
          titre="Kilomètres des 12 prochains mois"
          valeur={texteValeur(p.projectionKilometres12Mois, "KILOMETRES")}
          precision={`Tendance : ${texteTendance(p.tendanceKilometresPourcent)} · heures : ${texteValeur(p.projectionHeures12Mois, "HEURES")}`}
        />
        <CarteChiffre
          titre={`Dépenses ${annee} (fin d'année)`}
          valeur={texteMontant(p.finAnneeProjection ?? p.finAnneeReel)}
          precision={
            p.finAnneeProjection === null ? "Réel à ce jour (pas de projection)" : `Dont ${texteMontant(p.finAnneeReel)} déjà dépensés`
          }
        />
      </div>

      {p.budgetCarburantAnnee !== null && (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            ecart !== null && ecart > 0 ? "bg-badge-warningBg text-badge-warningFg" : "bg-muted/30 text-muted-foreground",
          )}
        >
          Budget carburant {annee} : <strong>{texteMontant(p.budgetCarburantAnnee)}</strong>. Carburant prévu à fin d'année :{" "}
          <strong>{texteMontant(p.finAnneeProjectionCarburant)}</strong>
          {ecart !== null && (
            <>
              {" "}
              ({ecart > 0 ? "dépassement prévu" : "sous le budget"} : {texteEcartMontant(ecart)})
            </>
          )}
          .
        </p>
      )}
      {idType !== null && (
        <p className="text-xs text-muted-foreground">Le budget carburant n'est comparé qu'à l'échelle de l'ensemble du parc.</p>
      )}

      <GraphePrevisions points={points} serie={serie} />

      <details className="rounded-xl border bg-card p-4 text-sm shadow-sm">
        <summary className="cursor-pointer font-medium">Détail mois par mois</summary>
        <div className="mt-3 max-h-96 overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Mois</th>
                <th className="px-2 py-2 text-right">Carburant</th>
                <th className="px-2 py-2 text-right">Maintenance</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-2 py-2 text-right">Km</th>
                <th className="px-2 py-2 text-right">Heures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...p.mois].reverse().map((m) => {
                const projete = m.nature === "PROJECTION";
                return (
                  <tr key={m.mois} className={cn(projete && "italic text-muted-foreground")}>
                    <td className="px-2 py-1.5">
                      {libelleMois(m.mois)}
                      {m.nature === "EN_COURS" && <span className="text-xs text-muted-foreground"> (en cours)</span>}
                      {projete && <span className="text-xs"> (projection)</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{texteMontant(projete ? m.projectionCarburant : m.carburant)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{projete ? "—" : texteMontant(m.maintenance)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{texteMontant(projete ? m.projectionTotal : m.total)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {texteValeur(projete ? m.projectionKilometres : m.kilometres, "KILOMETRES")}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{texteValeur(projete ? m.projectionHeures : m.heures, "HEURES")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      <p className="text-xs text-muted-foreground">
        Méthode : moyenne des 3 derniers mois complets ; projection par la droite de tendance des 12 derniers mois complets (jamais
        négative). Les saisons ne sont pas prises en compte : une projection reste une indication. Véhicules réformés ou vendus exclus.
      </p>
    </div>
  );
}
