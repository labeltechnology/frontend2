import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { texteMontant } from "@/features/couts/couts";
import { useSinistralite } from "@/features/fiabilite/api";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { RESPONSABILITES, STATUTS_DOSSIER, textePourcent } from "@/features/fiabilite/fiabilite";
import { SinistreDialog, type CibleSinistre } from "@/features/fiabilite/SinistreDialog";
import { FiltresPerformance } from "@/features/performance/sections/FiltresPerformance";
import { useGenererRapport } from "@/features/rapports/api";
import { RapportApercuDialog } from "@/features/rapports/RapportApercuDialog";
import { bornesPeriode } from "@/features/rapports/periodes";
import { ApiError } from "@/lib/api-client";
import { cn, formatDate } from "@/lib/utils";
import type { GroupeSinistres, ResponsabiliteSinistre } from "@/types/fiabilite";
import type { Rapport } from "@/types/rapport";

/**
 * Onglet « Sinistres » (2026-09-29) : sinistralité de la période (incidents
 * survenus dans la période qui ont un volet sinistre) — dommages, franchises,
 * indemnisations, reste à charge, par responsabilité, véhicule et conducteur.
 */
export function OngletSinistres({ actif, peutModifier }: { actif: boolean; peutModifier: boolean }) {
  const annee = useMemo(() => bornesPeriode("CETTE_ANNEE", new Date()), []);
  const [debut, setDebut] = useState(annee.debut);
  const [fin, setFin] = useState(annee.fin);
  const [cible, setCible] = useState<CibleSinistre | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const requete = useSinistralite(debut, fin, actif);
  const generer = useGenererRapport();
  const d = requete.data;
  const total = d ? Math.max(1, d.nombreSinistres) : 1;

  const genererPdf = async () => {
    try {
      setRapport(await generer.mutateAsync({ type: "SINISTRALITE", dateDebutPeriode: debut, dateFinPeriode: fin }));
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
        onRapport={genererPdf}
        rapportEnCours={generer.isPending}
      />
      <EtatChargement enCours={requete.isPending && requete.fetchStatus !== "idle"} erreur={requete.error} />

      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <CarteChiffre titre="Sinistres" valeur={d.nombreSinistres} precision={`${d.nombreDossiersOuverts} dossier${d.nombreDossiersOuverts > 1 ? "s" : ""} ouvert${d.nombreDossiersOuverts > 1 ? "s" : ""}`} />
            <CarteChiffre titre="Dommages" valeur={texteMontant(d.montantDommages)} />
            <CarteChiffre titre="Indemnisations reçues" valeur={texteMontant(d.montantIndemnisations)} precision={`Taux : ${textePourcent(d.tauxIndemnisation)}`} />
            <CarteChiffre titre="Franchises" valeur={texteMontant(d.montantFranchises)} />
            <CarteChiffre
              titre="Reste à charge"
              valeur={texteMontant(d.montantResteACharge)}
              classeValeur={d.montantResteACharge > 0 ? "text-badge-dangerFg" : undefined}
              precision={d.nombreDossiersOuverts > 0 ? "Provisoire : dossiers ouverts" : undefined}
            />
            <CarteChiffre
              titre="Accidents et vols sans volet"
              valeur={d.nombreAccidentsSansDossier}
              classeValeur={d.nombreAccidentsSansDossier > 0 ? "text-badge-warningFg" : undefined}
              precision={
                d.nombreAccidentsSansDossier > 0 ? (
                  <Link to="/incidents" className="text-primary hover:underline">
                    Compléter dans Incidents
                  </Link>
                ) : undefined
              }
            />
          </div>

          <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="titre-responsabilite">
            <h2 id="titre-responsabilite" className="font-display text-lg font-semibold">Par responsabilité</h2>
            <ul className="mt-3 space-y-2">
              {(Object.keys(RESPONSABILITES) as ResponsabiliteSinistre[]).map((r) => {
                const n = d.parResponsabilite[r] ?? 0;
                return (
                  <li key={r} className="grid grid-cols-[11rem_1fr_3rem] items-center gap-3 text-sm">
                    <span>{RESPONSABILITES[r].libelle}</span>
                    <span className="h-2.5 rounded-full bg-muted" aria-hidden="true">
                      {n > 0 && <span className="block h-full rounded-full bg-primary" style={{ width: `${(n / total) * 100}%` }} />}
                    </span>
                    <span className="text-right tabular-nums">{n}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="space-y-2" aria-labelledby="titre-sinistres">
            <h2 id="titre-sinistres" className="font-display text-lg font-semibold">Sinistres de la période</h2>
            {d.sinistres.length === 0 ? (
              <p className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
                Aucun sinistre. Ouvrez un incident (accident, vol) dans <Link to="/incidents" className="text-primary hover:underline">Incidents</Link>, puis{" "}
                <strong>Volet sinistre</strong>.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Survenu le</th>
                      <th className="px-3 py-2">Véhicule</th>
                      <th className="px-3 py-2">Dossier</th>
                      <th className="px-3 py-2">Responsabilité</th>
                      <th className="px-3 py-2 text-right">Dommages</th>
                      <th className="px-3 py-2 text-right">Indemnisé</th>
                      <th className="px-3 py-2 text-right">Reste à charge</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {d.sinistres.map((s) => (
                      <tr key={s.idIncident}>
                        <td className="px-3 py-2 tabular-nums">{formatDate(s.dateSurvenue.slice(0, 10))}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{s.libelleVehicule ?? "—"}</span>
                          <span className="block text-xs text-muted-foreground">{s.nomConducteur ?? "Sans conducteur"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span>{s.numeroDossier ?? "Sans numéro"}</span>
                          <span className="block text-xs text-muted-foreground">{s.assureur ?? ""}</span>
                          <Pastille libelle={STATUTS_DOSSIER[s.statutDossier].libelle} classes={STATUTS_DOSSIER[s.statutDossier].classes} />
                        </td>
                        <td className="px-3 py-2">
                          <Pastille libelle={RESPONSABILITES[s.responsabilite].libelle} classes={RESPONSABILITES[s.responsabilite].classes} />
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{texteMontant(s.montantDommages)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{texteMontant(s.indemnisationRecue ?? 0)}</td>
                        <td className={cn("px-3 py-2 text-right font-medium tabular-nums", s.resteACharge > 0 && "text-badge-dangerFg")}>
                          {texteMontant(s.resteACharge)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCible({
                                idIncident: s.idIncident,
                                libelle: `${s.libelleVehicule ?? "Véhicule"} — incident du ${formatDate(s.dateSurvenue.slice(0, 10))}`,
                                coutEstime: s.montantDommagesSaisi === null ? s.montantDommages : null,
                              })
                            }
                          >
                            {peutModifier ? "Modifier" : "Voir"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <TableauGroupes titre="Par véhicule" groupes={d.parVehicule} colonneResponsable={false} />
            <TableauGroupes titre="Par conducteur" groupes={d.parConducteur} colonneResponsable />
          </div>
        </>
      )}

      <SinistreDialog cible={cible} peutModifier={peutModifier} onFermer={() => setCible(null)} />
      <RapportApercuDialog rapport={rapport} onOpenChange={(open) => !open && setRapport(null)} onRegenere={setRapport} />
    </div>
  );
}

function TableauGroupes({ titre, groupes, colonneResponsable }: { titre: string; groupes: GroupeSinistres[]; colonneResponsable: boolean }) {
  if (groupes.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold">{titre}</h2>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">{titre.replace("Par ", "").replace(/^./, (c) => c.toUpperCase())}</th>
              <th className="px-3 py-2 text-right">Sinistres</th>
              {colonneResponsable && <th className="px-3 py-2 text-right">Responsable ou partagé</th>}
              <th className="px-3 py-2 text-right">Dommages</th>
              <th className="px-3 py-2 text-right">Reste à charge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groupes.map((g) => (
              <tr key={g.id ?? g.libelle}>
                <td className="px-3 py-2 font-medium">{g.libelle}</td>
                <td className="px-3 py-2 text-right tabular-nums">{g.nombre}</td>
                {colonneResponsable && (
                  <td className={cn("px-3 py-2 text-right tabular-nums", g.nombreResponsable > 0 && "text-badge-warningFg")}>{g.nombreResponsable}</td>
                )}
                <td className="px-3 py-2 text-right tabular-nums">{texteMontant(g.montantDommages)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{texteMontant(g.montantResteACharge)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
