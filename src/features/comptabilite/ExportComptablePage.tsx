import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/data-table/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { useApercuExport, useParametresComptables, useTelechargerExport } from "@/features/comptabilite/api";
import { CHAMPS_PLAN, erreurPeriode, libelleSource, PERIODES_EXPORT, SOURCES, TOUTES_SOURCES } from "@/features/comptabilite/comptabilite";
import { texteMontant } from "@/features/couts/couts";
import { EtatChargement } from "@/features/fiabilite/EtatChargement";
import { bornesPeriode, PERIODES } from "@/features/rapports/periodes";
import { ApiError } from "@/lib/api-client";
import { peut } from "@/lib/droits";
import { cn, declencherTelechargementBlob } from "@/lib/utils";
import type { SourceComptable } from "@/types/comptabilite";

/**
 * Export comptable (2026-09-29, question du DG « intégration comptable ») :
 * fichier CSV d'écritures (date, journal, pièce, compte, libellé, débit,
 * crédit, centre de coût = véhicule, tiers) à importer dans le logiciel de
 * comptabilité. Aperçu par source et par journal avant téléchargement.
 * Serveur : comptabilite/ExportComptableService.
 */
export function ExportComptablePage() {
  const { session } = useAuth();
  const administration = peut(session?.role, "ADMINISTRER");
  const initiale = bornesPeriode("MOIS_DERNIER", new Date());
  const [debut, setDebut] = useState(initiale.debut);
  const [fin, setFin] = useState(initiale.fin);
  const [sources, setSources] = useState<SourceComptable[]>(TOUTES_SOURCES);

  const erreur = erreurPeriode(debut, fin);
  const pret = erreur === null && sources.length > 0;
  const apercu = useApercuExport(debut, fin, sources, pret);
  const plan = useParametresComptables();
  const telecharger = useTelechargerExport();
  const a = apercu.data;

  const basculerSource = (s: SourceComptable, coche: boolean) =>
    setSources((liste) => (coche ? TOUTES_SOURCES.filter((x) => x === s || liste.includes(x)) : liste.filter((x) => x !== s)));

  const choisirPeriode = (cle: (typeof PERIODES_EXPORT)[number]) => {
    const b = bornesPeriode(cle, new Date());
    setDebut(b.debut);
    setFin(b.fin);
  };

  const onTelecharger = async () => {
    try {
      const blob = await telecharger.mutateAsync({ debut, fin, sources });
      declencherTelechargementBlob(blob, `ecritures-${debut}-${fin}.csv`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Téléchargement impossible");
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <PageHeader
        title="Export comptable"
        description="Écritures des factures, du carburant et de la maintenance, au format CSV pour votre logiciel de comptabilité."
        actions={
          <Button onClick={onTelecharger} disabled={!pret || telecharger.isPending || (a != null && a.nombreEcritures === 0)}>
            {telecharger.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Télécharger le CSV
          </Button>
        }
      />

      <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm" aria-label="Choix de la période et des sources">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="debutExport">Du</Label>
            <Input id="debutExport" type="date" value={debut} onChange={(e) => setDebut(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="finExport">Au</Label>
            <Input id="finExport" type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="w-44" />
          </div>
          <div className="flex flex-wrap gap-1">
            {PERIODES_EXPORT.map((cle) => (
              <Button key={cle} type="button" variant="outline" size="sm" onClick={() => choisirPeriode(cle)}>
                {PERIODES.find((p) => p.cle === cle)?.libelle}
              </Button>
            ))}
          </div>
        </div>
        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Opérations à exporter</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SOURCES.map((s) => (
              <label key={s.cle} className="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/40">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={sources.includes(s.cle)}
                  onChange={(e) => basculerSource(s.cle, e.target.checked)}
                />
                <span>
                  <span className="font-medium">{s.libelle}</span>
                  <span className="block text-xs text-muted-foreground">{s.description}</span>
                </span>
              </label>
            ))}
          </div>
          {sources.length === 0 && <p className="text-sm text-destructive">Cochez au moins une source.</p>}
        </fieldset>
      </section>

      {pret && !a && <EtatChargement enCours={apercu.isPending} erreur={apercu.error} />}

      {pret && a && (
        <section className="space-y-4" aria-labelledby="titre-apercu-export">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titre-apercu-export" className="font-display text-lg font-semibold">
              Aperçu : {a.nombreEcritures} ligne{a.nombreEcritures > 1 ? "s" : ""} d'écriture
            </h2>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                a.equilibre ? "bg-badge-successBg text-badge-successFg" : "bg-badge-dangerBg text-badge-dangerFg",
              )}
            >
              {a.equilibre ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
              {a.equilibre ? "Chaque pièce est équilibrée" : "Écritures déséquilibrées : ne pas importer"}
            </span>
          </div>
          {a.nombreIgnores > 0 && (
            <p className="rounded-xl border bg-badge-warningBg px-4 py-3 text-sm text-badge-warningFg">
              {a.nombreIgnores} opération{a.nombreIgnores > 1 ? "s" : ""} sans montant ignorée{a.nombreIgnores > 1 ? "s" : ""} : complétez
              les montants pour les exporter.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <caption className="px-3 pt-3 text-left text-sm font-semibold">Par source</caption>
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Opérations</th>
                    <th className="px-3 py-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {a.sources.map((s) => (
                    <tr key={s.source}>
                      <td className="px-3 py-2">{libelleSource(s.source)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{s.nombreOperations}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(s.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <caption className="px-3 pt-3 text-left text-sm font-semibold">Par journal</caption>
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Journal</th>
                    <th className="px-3 py-2 text-right">Lignes</th>
                    <th className="px-3 py-2 text-right">Débit</th>
                    <th className="px-3 py-2 text-right">Crédit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {a.journaux.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-muted-foreground">
                        Aucune opération sur la période.
                      </td>
                    </tr>
                  ) : (
                    a.journaux.map((j) => (
                      <tr key={j.journal}>
                        <td className="px-3 py-2 font-mono">{j.journal}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{j.nombreEcritures}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{texteMontant(j.debit)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{texteMontant(j.credit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {a.journaux.length > 0 && (
                  <tfoot className="border-t font-medium">
                    <tr>
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right tabular-nums">{a.nombreEcritures}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(a.totalDebit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{texteMontant(a.totalCredit)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </section>
      )}

      <details className="rounded-xl border bg-card p-4 text-sm shadow-sm">
        <summary className="cursor-pointer font-medium">Plan comptable utilisé</summary>
        {plan.data ? (
          <div className="mt-3 space-y-3">
            <p className="text-muted-foreground">
              Séparateur « {plan.data.separateur} » ·{" "}
              {administration ? (
                <Link to="/parametres" className="text-primary hover:underline">
                  modifier dans Paramètres
                </Link>
              ) : (
                "modifiable par l'administration dans Paramètres"
              )}
              . Colonnes : date, journal, pièce, compte, libellé, débit, crédit, centre de coût (véhicule), tiers.
            </p>
            <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {CHAMPS_PLAN.flatMap((g) => g.champs).map((c) => (
                <div key={c.cle} className="flex justify-between gap-2 border-b border-dashed py-1">
                  <dt className="text-muted-foreground">{c.libelle}</dt>
                  <dd className="font-mono">{plan.data[c.cle]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <EtatChargement enCours={plan.isPending} erreur={plan.error} />
        )}
      </details>
    </div>
  );
}
