import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/data-table/PageHeader";
import { useMiseEnService } from "@/features/mise-en-service/api";
import { etapeEnCours, pourcentageEtape, texteAvancement } from "@/features/mise-en-service/mise-en-service";
import { cn } from "@/lib/utils";

/**
 * Assistant de mise en service (2026-09-30) : les 5 étapes de réglage sans
 * lesquelles les indicateurs restent vides ou faux, dans l'ordre. Chaque
 * point se coche seul quand la donnée existe ; « Régler » ouvre la page où
 * le faire. Réservé à l'administration (DG, responsable du parc,
 * administrateur).
 */
export function MiseEnServicePage() {
  const requete = useMiseEnService();
  const m = requete.data;
  const suivante = m ? etapeEnCours(m) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mise en service"
        description="Les réglages à faire pour que les chiffres du logiciel soient justes, dans l'ordre. Chaque point se coche seul quand la donnée existe."
        actions={
          <Button variant="outline" onClick={() => requete.refetch()} disabled={requete.isFetching}>
            <RefreshCw className={cn("h-4 w-4", requete.isFetching && "animate-spin")} aria-hidden="true" />
            Actualiser
          </Button>
        }
      />

      {requete.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Vérification des réglages…
        </p>
      )}
      {requete.isError && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">Avancement indisponible pour le moment.</p>}

      {m && (
        <>
          <section className="flex flex-wrap items-center gap-6 rounded-xl border bg-card p-5" aria-label="Avancement général">
            <div>
              <p className="text-4xl font-bold tabular-nums">{m.pourcentage} %</p>
              <p className="text-sm text-muted-foreground">{texteAvancement(m)}</p>
            </div>
            <div
              className="h-3 min-w-[12rem] flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={m.pourcentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Avancement de la mise en service"
            >
              <div className={cn("h-full", m.pourcentage === 100 ? "bg-badge-successFg" : "bg-primary")} style={{ width: `${m.pourcentage}%` }} />
            </div>
            {suivante && (
              <p className="text-sm">
                À faire maintenant : <strong>étape {suivante.numero}, {suivante.titre.toLowerCase()}</strong>
              </p>
            )}
          </section>

          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {m.etapes.map((e) => {
              const pct = pourcentageEtape(e);
              const complete = e.faits === e.total;
              return (
                <li key={e.numero} className={cn("flex flex-col gap-3 rounded-xl border bg-card p-4", suivante?.numero === e.numero && "border-primary")}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-active font-bold text-primary">{e.numero}</span>
                    <h2 className="font-semibold">{e.titre}</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">Qui : {e.qui}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {e.faits} sur {e.total}
                      </span>
                      <span className="font-semibold tabular-nums">{pct} %</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Avancement : ${e.titre}`}>
                      <div className={cn("h-full", complete ? "bg-badge-successFg" : "bg-primary")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ul className="flex flex-1 flex-col gap-2.5">
                    {e.points.map((p) => (
                      <li key={p.libelle} className="text-sm">
                        <div className="flex items-start gap-2">
                          {p.fait ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-badge-successFg" aria-label="Fait" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-badge-warningFg" aria-label="À faire" />
                          )}
                          <div className="min-w-0">
                            <p className={cn(p.fait && "text-muted-foreground")}>{p.libelle}</p>
                            {p.detail && <p className="text-xs text-muted-foreground">{p.detail}</p>}
                            {!p.fait && (
                              <Link to={p.lien} className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">
                                Régler <ChevronRight className="h-3 w-3" aria-hidden="true" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
