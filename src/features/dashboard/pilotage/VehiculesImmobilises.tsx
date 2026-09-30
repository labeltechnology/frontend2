import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import { texteDuree } from "@/features/dashboard/pilotage/pilotage";
import { cn, formatDateTime, formatMontant } from "@/lib/utils";
import type { Immobilisation } from "@/types/pilotage";

/**
 * « Véhicules immobilisés » (2026-09-30) : pannes d'abord, puis sans prise
 * en charge, puis les plus anciennes. Motif, durée, atelier, état de la
 * réparation, coût d'une journée d'immobilisation et chantier touché.
 */
export function VehiculesImmobilises({
  immobilisations,
  enChargement,
  enErreur,
}: {
  immobilisations: Immobilisation[] | undefined;
  enChargement: boolean;
  enErreur: boolean;
}) {
  const liste = immobilisations ?? [];
  const coutJour = liste.reduce((s, i) => s + (i.coutJour ?? 0), 0);
  return (
    <CadreSection
      titre="Véhicules immobilisés"
      icone={Wrench}
      lien="/maintenance"
      libelleLien="Maintenance"
      actions={
        liste.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {liste.length} véhicule{liste.length > 1 ? "s" : ""}
            {coutJour > 0 && <span className="text-badge-dangerFg"> · {formatMontant(coutJour)} / jour</span>}
          </span>
        )
      }
    >
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : enErreur ? (
        <EtatBloc erreur>Liste indisponible.</EtatBloc>
      ) : liste.length === 0 ? (
        <EtatBloc>Aucun véhicule immobilisé.</EtatBloc>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Véhicules en panne ou en maintenance</caption>
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Véhicule</th>
                <th className="px-2 py-2 font-medium">Motif</th>
                <th className="px-2 py-2 text-right font-medium">Depuis</th>
                <th className="px-2 py-2 font-medium">Atelier</th>
                <th className="px-2 py-2 font-medium">État</th>
                <th className="px-2 py-2 text-right font-medium">Coût / jour</th>
                <th className="py-2 pl-2 font-medium">Chantier</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {liste.map((i) => {
                const panne = i.statut === "EN_PANNE";
                return (
                  <tr key={i.idEngin} className="align-top">
                    <td className="py-2 pr-3">
                      <Link to={i.lien} className="font-medium text-foreground hover:underline">
                        {i.vehicule}
                      </Link>
                      <span className="block text-xs text-muted-foreground">{i.typeEngin ?? "—"}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "mr-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          panne ? "bg-badge-dangerBg text-badge-dangerFg" : "bg-badge-warningBg text-badge-warningFg",
                        )}
                      >
                        {panne ? "Panne" : "Maintenance"}
                      </span>
                      {i.motif}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" title={i.depuis ? formatDateTime(i.depuis) : undefined}>
                      {texteDuree(i.heures)}
                    </td>
                    <td className="px-2 py-2">{i.atelier ?? <span className="text-badge-dangerFg">À désigner</span>}</td>
                    <td className={cn("px-2 py-2 text-xs", !i.priseEnCharge && "font-medium text-badge-dangerFg")}>{i.etat}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {i.coutJour === null ? <span className="text-muted-foreground">non chiffré</span> : formatMontant(i.coutJour)}
                      {i.coutCumule !== null && <span className="block text-xs text-muted-foreground">cumulé {formatMontant(i.coutCumule)}</span>}
                    </td>
                    <td className="py-2 pl-2">
                      {i.idChantier !== null ? (
                        <Link to={`/chantiers/${i.idChantier}/fiche`} className="hover:underline">
                          {i.chantier}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {liste.some((i) => i.coutJour === null) && (
        <p className="mt-2 text-xs text-muted-foreground">
          « Non chiffré » : coût d'une journée d'immobilisation à régler par type (Fiabilité et conformité → Réglages par type).
        </p>
      )}
    </CadreSection>
  );
}
