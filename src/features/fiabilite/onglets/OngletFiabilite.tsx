import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { texteMontant } from "@/features/couts/couts";
import { useFiabilite } from "@/features/fiabilite/api";
import { EtatChargement } from "@/features/fiabilite/EtatChargement";
import { classeTauxObjectif, texteHeures, texteMtbf, textePourcent, texteRetard } from "@/features/fiabilite/fiabilite";
import { FiltresPerformance } from "@/features/performance/sections/FiltresPerformance";
import { nombreFr } from "@/features/performance/performance";
import { useGenererRapport } from "@/features/rapports/api";
import { RapportApercuDialog } from "@/features/rapports/RapportApercuDialog";
import { bornesPeriode } from "@/features/rapports/periodes";
import { ApiError } from "@/lib/api-client";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import type { TypeEngin } from "@/types/engin";
import type { Rapport } from "@/types/rapport";

const OBJECTIF_DISPONIBILITE = 90;
const OBJECTIF_ECHEANCES = 90;

/**
 * Onglet « Fiabilité » (2026-09-29) : disponibilité, immobilisations et leur
 * coût, pannes et temps moyen entre pannes (MTBF), délai de réparation par
 * atelier ou garage (MTTR), contrôle qualité à la clôture, respect du
 * planning d'entretien. Même période et mêmes jours que la page Performance.
 */
export function OngletFiabilite({ types, peutGenererRapport }: { types: TypeEngin[]; peutGenererRapport: boolean }) {
  const annee = useMemo(() => bornesPeriode("CETTE_ANNEE", new Date()), []);
  const [debut, setDebut] = useState(annee.debut);
  const [fin, setFin] = useState(annee.fin);
  const [idTypeEngin, setIdTypeEngin] = useState<number | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const requete = useFiabilite(debut, fin, idTypeEngin);
  const generer = useGenererRapport();
  const d = requete.data;

  const genererPdf = async () => {
    try {
      setRapport(await generer.mutateAsync({ type: "FIABILITE_CONFORMITE", dateDebutPeriode: debut, dateFinPeriode: fin }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Génération du rapport impossible");
    }
  };

  return (
    <div className="space-y-5">
      <FiltresPerformance
        debut={debut}
        fin={fin}
        onPeriode={(a, b) => {
          setDebut(a);
          setFin(b);
        }}
        idTypeEngin={idTypeEngin}
        onType={setIdTypeEngin}
        types={types}
        onRapport={peutGenererRapport ? genererPdf : undefined}
        rapportEnCours={generer.isPending}
      />
      <EtatChargement enCours={requete.isPending && requete.fetchStatus !== "idle"} erreur={requete.error} />

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <CarteChiffre
              titre="Disponibilité"
              valeur={textePourcent(d.tauxDisponibilite)}
              classeValeur={classeTauxObjectif(d.tauxDisponibilite, OBJECTIF_DISPONIBILITE)}
              precision={`Objectif ${OBJECTIF_DISPONIBILITE} %`}
            />
            <CarteChiffre
              titre="Immobilisations"
              valeur={`${nombreFr(d.joursImmobilises)} j`}
              precision={
                d.coutImmobilisation === null
                  ? "Coût non chiffré : réglez-le par type"
                  : `Coût : ${texteMontant(d.coutImmobilisation)}${d.nombreSansCoutImmobilisation > 0 ? ` (${d.nombreSansCoutImmobilisation} sans coût réglé)` : ""}`
              }
            />
            <CarteChiffre titre="Pannes" valeur={d.pannes} precision={texteMtbf(d.mtbfJours, d.pannes)} />
            <CarteChiffre
              titre="Délai moyen de réparation"
              valeur={texteHeures(d.mttr.heuresMoyennes)}
              precision={`${d.mttr.nombre} réparation${d.mttr.nombre > 1 ? "s" : ""} terminée${d.mttr.nombre > 1 ? "s" : ""}`}
            />
            <CarteChiffre
              titre="Entretiens faits à temps"
              valeur={textePourcent(d.echeances.tauxATemps)}
              classeValeur={classeTauxObjectif(d.echeances.tauxATemps, OBJECTIF_ECHEANCES)}
              precision={`${d.echeances.nombreNonFaitesEnRetard} en retard à faire`}
            />
            <CarteChiffre
              titre="Maintenances contrôlées"
              valeur={textePourcent(d.controles.tauxControle)}
              precision={`${d.controles.nombreAvecReserve} avec réserve`}
              classeValeur={d.controles.nombreAvecReserve > 0 ? "text-badge-warningFg" : undefined}
            />
          </div>

          <section className="space-y-2" aria-labelledby="titre-fiab-types">
            <h2 id="titre-fiab-types" className="font-display text-lg font-semibold">Par type de véhicule</h2>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Véhicules</th>
                    <th className="px-3 py-2 text-right">Disponibilité</th>
                    <th className="px-3 py-2 text-right">Jours immobilisés</th>
                    <th className="px-3 py-2 text-right">Coût d'immobilisation</th>
                    <th className="px-3 py-2 text-right">Pannes</th>
                    <th className="px-3 py-2 text-right">Entre deux pannes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.types.map((t) => (
                    <tr key={t.idTypeEngin ?? t.libelle ?? "?"}>
                      <td className="px-3 py-2 font-medium">{t.libelle ?? "Sans type"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{t.nombreVehicules}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", classeTauxObjectif(t.tauxDisponibilite, OBJECTIF_DISPONIBILITE))}>
                        {textePourcent(t.tauxDisponibilite)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{nombreFr(t.joursImmobilises)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {t.coutImmobilisation === null ? <span className="text-muted-foreground">Non chiffré</span> : texteMontant(t.coutImmobilisation)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{t.pannes}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {t.mtbfJours === null ? "—" : `${nombreFr(t.mtbfJours, 1)} j`}
                        {t.mtbfUsage !== null && <span className="block text-xs text-muted-foreground">{nombreFr(t.mtbfUsage)} {t.uniteUsage}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="space-y-2" aria-labelledby="titre-mttr">
              <h2 id="titre-mttr" className="font-display text-lg font-semibold">Délai de réparation par atelier ou garage</h2>
              <p className="text-xs text-muted-foreground">Maintenances correctives terminées dans la période, du démarrage à la fin (heures calendaires).</p>
              {d.mttr.reparateurs.length === 0 ? (
                <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Aucune réparation terminée sur la période.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Réparateur</th>
                        <th className="px-3 py-2 text-right">Réparations</th>
                        <th className="px-3 py-2 text-right">Délai moyen</th>
                        <th className="px-3 py-2 text-right">Plus long</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {d.mttr.reparateurs.map((r) => (
                        <tr key={r.idGarage ?? "interne"}>
                          <td className="px-3 py-2 font-medium">{r.libelle}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.nombre}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{texteHeures(r.heuresMoyennes)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{texteHeures(r.heuresMax)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-2" aria-labelledby="titre-reserves">
              <h2 id="titre-reserves" className="font-display text-lg font-semibold">Réserves au contrôle qualité</h2>
              <p className="text-xs text-muted-foreground">
                {d.controles.nombreControlees} maintenance{d.controles.nombreControlees > 1 ? "s" : ""} contrôlée{d.controles.nombreControlees > 1 ? "s" : ""} sur{" "}
                {d.controles.nombreTerminees} terminée{d.controles.nombreTerminees > 1 ? "s" : ""}.
              </p>
              {d.controles.reserves.length === 0 ? (
                <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Aucune réserve sur la période.</p>
              ) : (
                <ul className="divide-y divide-border rounded-xl border bg-card shadow-sm">
                  {d.controles.reserves.map((r) => (
                    <li key={r.idMaintenance} className="px-4 py-2.5 text-sm">
                      <p className="font-medium">
                        {r.libelleVehicule} <span className="font-normal text-muted-foreground">· maintenance n°{r.idMaintenance}</span>
                      </p>
                      <p>{r.reserve}</p>
                      <p className="text-xs text-muted-foreground">
                        Contrôlée par {r.controlePar} le {formatDateTime(r.dateControle)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="space-y-2" aria-labelledby="titre-echeances">
            <h2 id="titre-echeances" className="font-display text-lg font-semibold">Respect du planning d'entretien</h2>
            <p className="text-xs text-muted-foreground">
              {d.echeances.nombreFaitesATemps} entretien{d.echeances.nombreFaitesATemps > 1 ? "s" : ""} à temps, {d.echeances.nombreFaitesEnRetard} en retard,{" "}
              {d.echeances.nombreNonFaitesEnRetard} dépassé{d.echeances.nombreNonFaitesEnRetard > 1 ? "s" : ""} et pas encore fait
              {d.echeances.nombreNonFaitesEnRetard > 1 ? "s" : ""}. Tolérance : 7 jours ou 5 % de l'intervalle.
            </p>
            {d.echeances.retards.length === 0 ? (
              <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Aucun entretien en retard.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Véhicule</th>
                      <th className="px-3 py-2">Poste</th>
                      <th className="px-3 py-2">Échéance</th>
                      <th className="px-3 py-2">Retard</th>
                      <th className="px-3 py-2">Situation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {d.echeances.retards.map((r, i) => (
                      <tr key={`${r.idEngin}-${r.libellePoste}-${i}`}>
                        <td className="px-3 py-2 font-medium">
                          <Link to={`/engins/${r.idEngin}/fiche`} className="hover:underline">
                            {r.libelleVehicule}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{r.libellePoste}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {r.dateEcheance ? formatDate(r.dateEcheance) : ""}
                          {r.dateEcheance && r.compteurEcheance !== null ? " · " : ""}
                          {r.compteurEcheance !== null ? `${nombreFr(r.compteurEcheance)} ${r.unite}` : ""}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-badge-dangerFg">{texteRetard(r)}</td>
                        <td className="px-3 py-2">
                          {r.situation === "NON_FAITE" ? (
                            <span className="font-medium text-badge-dangerFg">À faire</span>
                          ) : (
                            <span className="text-muted-foreground">Fait le {formatDate(r.dateIntervention)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-2" aria-labelledby="titre-fiab-vehicules">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="titre-fiab-vehicules" className="font-display text-lg font-semibold">Par véhicule</h2>
              <Link to="/renouvellement?onglet=plan" className="text-sm text-primary hover:underline">
                Voir le plan de renouvellement →
              </Link>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Véhicule</th>
                    <th className="px-3 py-2 text-right">Pannes</th>
                    <th className="px-3 py-2">Dernière panne</th>
                    <th className="px-3 py-2 text-right">Jours immobilisés</th>
                    <th className="px-3 py-2 text-right">Disponibilité</th>
                    <th className="px-3 py-2 text-right">Coût d'immobilisation</th>
                    <th className="px-3 py-2 text-right">Entre deux pannes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.vehicules.map((v) => (
                    <tr key={v.idEngin}>
                      <td className="px-3 py-2">
                        <Link to={`/engins/${v.idEngin}/fiche`} className="font-medium hover:underline">
                          {v.libelleVehicule}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{v.libelleType}</span>
                      </td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", v.pannes > 0 && "font-medium text-badge-warningFg")}>{v.pannes}</td>
                      <td className="px-3 py-2 tabular-nums">{formatDate(v.dernierePanne)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{nombreFr(v.joursImmobilises)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", classeTauxObjectif(v.tauxDisponibilite, OBJECTIF_DISPONIBILITE))}>
                        {textePourcent(v.tauxDisponibilite)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(v.coutImmobilisation)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {v.mtbfJours === null ? "—" : `${nombreFr(v.mtbfJours, 1)} j`}
                        {v.mtbfUsage !== null && <span className="block text-xs text-muted-foreground">{nombreFr(v.mtbfUsage)} {v.uniteUsage}</span>}
                      </td>
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
