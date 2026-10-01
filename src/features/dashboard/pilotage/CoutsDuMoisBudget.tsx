import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { useCoutsMois } from "@/features/dashboard/pilotage/pilotage-api";
import {
  PRESENTATION_ETAT_BUDGET,
  barresBudget,
  decalerMois,
  libelleMoisLong,
  moisCourant,
} from "@/features/dashboard/pilotage/pilotage";
import { cn, formatMontant } from "@/lib/utils";
import type { LigneCoutMois } from "@/types/pilotage";

/**
 * « Coûts du mois » (2026-09-30) : par poste, budget du mois, dépensé à date,
 * projection de fin de mois et écart projeté ; état tenu / risque / dépassé.
 * Budgets : carburant (par type) et autres postes, saisis dans Coûts → Budget.
 */
export function CoutsDuMoisBudget({ actif }: { actif: boolean }) {
  const courant = moisCourant(new Date());
  const [mois, setMois] = useState(courant);
  const requete = useCoutsMois(mois, actif);
  const c = requete.data;

  return (
    <CadreSection
      titre="Coûts du mois face au budget"
      icone={Wallet}
      lien="/couts?onglet=budget"
      libelleLien="Budgets"
      actions={
        <span className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMois((m) => decalerMois(m, -1))} aria-label="Mois précédent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[7rem] text-center text-xs font-medium capitalize">{libelleMoisLong(mois)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMois((m) => decalerMois(m, 1))}
            disabled={mois >= courant}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </span>
      }
    >
      {requete.isLoading ? (
        <EtatBloc>Calcul des coûts…</EtatBloc>
      ) : requete.isError || !c ? (
        <EtatBloc erreur>Coûts du mois indisponibles.</EtatBloc>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {c.joursEcoules < c.joursMois
              ? `${c.joursEcoules} jour${c.joursEcoules > 1 ? "s" : ""} écoulé${c.joursEcoules > 1 ? "s" : ""} sur ${c.joursMois} : la projection prolonge le rythme actuel.`
              : "Mois terminé : la projection correspond aux montants réels."}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <caption className="sr-only">Budget, réel et projection par poste</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Poste</th>
                  <th className="px-2 py-2 text-right font-medium">Budget</th>
                  <th className="px-2 py-2 text-right font-medium">Dépensé</th>
                  <th className="px-2 py-2 text-right font-medium">Projection</th>
                  <th className="px-2 py-2 text-right font-medium">Écart projeté</th>
                  <th className="py-2 pl-2 font-medium">État</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {c.postes.map((l) => (
                  <Ligne key={l.poste ?? l.libelle} l={l} />
                ))}
              </tbody>
              <tfoot className="border-t-2 font-semibold">
                <Ligne l={c.total} />
              </tfoot>
            </table>
          </div>
          {c.postesSansBudget.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Sans budget : {c.postesSansBudget.join(", ")}.{" "}
              <Link to="/couts?onglet=budget" className="text-primary hover:underline">
                Saisir les budgets
              </Link>
            </p>
          )}
        </div>
      )}
    </CadreSection>
  );
}

function Ligne({ l }: { l: LigneCoutMois }) {
  const etat = PRESENTATION_ETAT_BUDGET[l.etat];
  const b = barresBudget(l);
  const ecartPositif = (l.ecartProjete ?? 0) > 0;
  return (
    <tr>
      <td className="py-2 pr-3">
        <span className="font-medium text-foreground">{l.libelle}</span>
        <div className="relative mt-1 h-1.5 w-full min-w-[80px] rounded-full bg-muted" aria-hidden>
          <span className="absolute inset-y-0 left-0 rounded-full bg-primary/30" style={{ width: `${b.projection}%` }} />
          <span className={cn("absolute inset-y-0 left-0 rounded-full", etat.lisere)} style={{ width: `${b.reel}%` }} />
          {l.budget !== null && <span className="absolute -top-0.5 h-2.5 w-0.5 bg-foreground" style={{ left: `${b.budget}%` }} />}
        </div>
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{l.budget === null ? "—" : formatMontant(l.budget)}</td>
      <td className="px-2 py-2 text-right tabular-nums">
        {formatMontant(l.reel)}
        {l.consommation !== null && <span className="block text-xs font-normal text-muted-foreground">{Math.round(l.consommation)} % du budget</span>}
      </td>
      <td className="px-2 py-2 text-right tabular-nums">{formatMontant(l.projection)}</td>
      <td className={cn("px-2 py-2 text-right tabular-nums", l.ecartProjete !== null && (ecartPositif ? "text-badge-dangerFg" : "text-badge-successFg"))}>
        {l.ecartProjete === null ? "—" : `${ecartPositif ? "+" : ""}${formatMontant(l.ecartProjete)}`}
        {l.ecartPourcent !== null && <span className="block text-xs font-normal">{`${l.ecartPourcent > 0 ? "+" : ""}${l.ecartPourcent} %`}</span>}
      </td>
      <td className="py-2 pl-2">
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", etat.classe)}>{etat.libelle}</span>
      </td>
    </tr>
  );
}
