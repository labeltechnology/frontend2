import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useTco } from "@/features/couts/api";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { COULEUR_GROUPE, postesTco, texteMontant } from "@/features/couts/couts";
import { FiltresPerformance } from "@/features/performance/sections/FiltresPerformance";
import { nombreFr, texteCoutUnitaire } from "@/features/performance/performance";
import { useGenererRapport } from "@/features/rapports/api";
import { RapportApercuDialog } from "@/features/rapports/RapportApercuDialog";
import { bornesPeriode } from "@/features/rapports/periodes";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { pluriel } from "@/lib/pluriel";
import type { TypeEngin } from "@/types/engin";
import type { Rapport } from "@/types/rapport";

/**
 * Onglet « Coût complet (TCO) » : coûts variables (saisies) + coûts fixes
 * (onglet Coûts de la fiche) sur la période, par poste, par type et par véhicule.
 */
export function OngletTco({ types, peutGenererRapport }: { types: TypeEngin[]; peutGenererRapport: boolean }) {
  const annee = useMemo(() => bornesPeriode("CETTE_ANNEE", new Date()), []);
  const [debut, setDebut] = useState(annee.debut);
  const [fin, setFin] = useState(annee.fin);
  const [idTypeEngin, setIdTypeEngin] = useState<number | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const tco = useTco(debut, fin, idTypeEngin);
  const generer = useGenererRapport();

  const genererPdf = async () => {
    try {
      setRapport(await generer.mutateAsync({ type: "COUTS_RENTABILITE", dateDebutPeriode: debut, dateFinPeriode: fin }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Génération du rapport impossible");
    }
  };

  const donnees = tco.data;
  const postes = donnees ? postesTco(donnees) : [];
  const max = Math.max(1, ...postes.map((p) => p.montant));
  const vehicules = donnees ? [...donnees.vehicules].sort((a, b) => b.total - a.total) : [];

  return (
    <div className="space-y-5">
      <FiltresPerformance
        debut={debut}
        fin={fin}
        onPeriode={(d, f) => {
          setDebut(d);
          setFin(f);
        }}
        idTypeEngin={idTypeEngin}
        onType={setIdTypeEngin}
        types={types}
        onRapport={peutGenererRapport ? genererPdf : undefined}
        rapportEnCours={generer.isPending}
      />

      {tco.isPending && tco.fetchStatus !== "idle" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Calcul en cours…
        </p>
      )}
      {tco.isError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {tco.error instanceof ApiError ? tco.error.message : "Calcul impossible pour le moment."}
        </p>
      )}

      {donnees && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <CarteChiffre titre="Coût complet de la période" valeur={texteMontant(donnees.total)} precision={`${pluriel(donnees.joursPeriode, "jour")} · ${pluriel(donnees.vehicules.length, "véhicule")}`} />
            <CarteChiffre titre="Coût complet par km" valeur={texteCoutUnitaire(donnees.coutParKm, "km")} precision="Véhicules routiers" />
            <CarteChiffre titre="Coût complet par heure" valeur={texteCoutUnitaire(donnees.coutParHeure, "h")} precision="Engins de chantier" />
            <CarteChiffre
              titre="Coûts fixes"
              valeur={texteMontant(donnees.coutsFixes.total)}
              precision={donnees.total > 0 ? `${nombreFr((donnees.coutsFixes.total / donnees.total) * 100, 1)} % du total` : undefined}
            />
            <CarteChiffre
              titre="Coûts fixes non saisis"
              valeur={`${donnees.nombreSansCoutsFixes} véhicule${donnees.nombreSansCoutsFixes > 1 ? "s" : ""}`}
              classeValeur={donnees.nombreSansCoutsFixes > 0 ? "text-badge-warningFg" : undefined}
              precision="Onglet « Coûts » de la fiche"
            />
          </div>

          <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-postes-tco">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titre-postes-tco" className="font-display text-lg font-semibold">Coût complet par poste</h2>
              <ul className="flex gap-4 text-xs text-muted-foreground" aria-label="Légende">
                {(["Variables", "Fixes"] as const).map((g) => (
                  <li key={g} className="flex items-center gap-1.5">
                    <span className={cn("h-2.5 w-2.5 rounded-sm", COULEUR_GROUPE[g])} aria-hidden="true" />
                    Coûts {g.toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
            <ul className="mt-3 space-y-2">
              {postes.map((p) => (
                <li key={p.cle} className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 text-sm" title={`${p.libelle} : ${texteMontant(p.montant)} (${nombreFr(p.part, 1)} %)`}>
                  <span className="truncate">{p.libelle}</span>
                  <span className="h-2.5 rounded-full bg-muted" aria-hidden="true">
                    {p.montant > 0 && <span className={cn("block h-full rounded-full", p.classe)} style={{ width: `${(p.montant / max) * 100}%` }} />}
                  </span>
                  <span className="w-44 text-right tabular-nums">
                    {texteMontant(p.montant)} <span className="text-muted-foreground">· {nombreFr(p.part, 1)} %</span>
                  </span>
                </li>
              ))}
            </ul>
            {donnees.dontPneus > 0 && <p className="mt-2 text-xs text-muted-foreground">Dont pneus (dans la maintenance) : {texteMontant(donnees.dontPneus)}</p>}
          </section>

          <section className="space-y-2" aria-labelledby="titre-tco-types">
            <h2 id="titre-tco-types" className="font-display text-lg font-semibold">Par type de véhicule</h2>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Véhicules</th>
                    <th className="px-3 py-2 text-right">Variables</th>
                    <th className="px-3 py-2 text-right">Fixes</th>
                    <th className="px-3 py-2 text-right">Coût complet</th>
                    <th className="px-3 py-2 text-right">Par véhicule</th>
                    <th className="px-3 py-2 text-right">Par km ou par heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {donnees.types.map((t) => (
                    <tr key={t.idTypeEngin ?? t.libelle}>
                      <td className="px-3 py-2 font-medium">{t.libelle}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{t.nombreVehicules}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(t.coutsVariables)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(t.coutsFixes)}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{texteMontant(t.total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(t.coutMoyenParVehicule)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteCoutUnitaire(t.coutParUnite, t.uniteUsage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2" aria-labelledby="titre-tco-vehicules">
            <h2 id="titre-tco-vehicules" className="font-display text-lg font-semibold">Par véhicule</h2>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Véhicule</th>
                    <th className="px-3 py-2 text-right">Usage</th>
                    <th className="px-3 py-2 text-right">Variables</th>
                    <th className="px-3 py-2 text-right">Fixes</th>
                    <th className="px-3 py-2 text-right">Coût complet</th>
                    <th className="px-3 py-2 text-right">Par km ou par heure</th>
                    <th className="px-3 py-2 text-right">Par jour</th>
                    <th className="px-3 py-2 text-right">Valeur nette</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vehicules.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Aucun véhicule sur ce filtre.</td>
                    </tr>
                  )}
                  {vehicules.map((v) => (
                    <tr key={v.idEngin} className="align-top">
                      <td className="px-3 py-2">
                        <span className="font-medium">{v.libelleVehicule}</span>
                        <span className="block text-xs text-muted-foreground">{v.libelleType}</span>
                        {!v.coutsFixesRenseignes && (
                          <Link
                            to={`/engins/${v.idEngin}/fiche?onglet=couts`}
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-badge-warningFg hover:underline"
                          >
                            <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                            Coûts fixes à saisir
                          </Link>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {nombreFr(v.usage, v.uniteUsage === "h" ? 1 : 0)} {v.uniteUsage}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {texteMontant(v.coutsVariables.total)}
                        {v.dontPneus > 0 && <span className="block text-xs text-muted-foreground">dont pneus {texteMontant(v.dontPneus)}</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.coutsFixes.total)}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{texteMontant(v.total)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteCoutUnitaire(v.coutParUnite, v.uniteUsage)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.coutParJour)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.valeurNetteComptable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <RapportApercuDialog rapport={rapport} onOpenChange={(open) => !open && setRapport(null)} onRegenere={setRapport} />
    </div>
  );
}
