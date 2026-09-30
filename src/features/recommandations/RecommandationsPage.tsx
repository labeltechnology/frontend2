import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileSpreadsheet, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarteChiffre } from "@/features/couts/CarteChiffre";
import { EtatChargement, Pastille } from "@/features/fiabilite/EtatChargement";
import { useRecommandations } from "@/features/recommandations/api";
import {
  compterParDomaine,
  DOMAINES,
  filtrer,
  FILTRES_DEFAUT,
  PRIORITES,
  tableauRecommandations,
  type FiltresRecommandations,
} from "@/features/recommandations/recommandations";
import { ApiError } from "@/lib/api-client";
import { exporterExcel } from "@/lib/export-excel";
import { cn, formatDate } from "@/lib/utils";
import type { DomaineRecommandation, PrioriteRecommandation } from "@/types/recommandation";

/**
 * Recommandations par règles (2026-09-29) : ce qu'il faudrait faire,
 * véhicule par véhicule ou conducteur par conducteur, avec le chiffre qui le
 * justifie et le lien vers l'écran de détail. Recalculées à chaque visite.
 */
export function RecommandationsPage() {
  const requete = useRecommandations();
  const [filtres, setFiltres] = useState<FiltresRecommandations>(FILTRES_DEFAUT);
  const d = requete.data;
  const visibles = useMemo(() => (d ? filtrer(d.recommandations, filtres) : []), [d, filtres]);
  const parDomaine = useMemo(() => (d ? compterParDomaine(d.recommandations) : {}), [d]);

  const exporter = async () => {
    if (!d) return;
    try {
      await exporterExcel(tableauRecommandations(visibles, d.date));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Export impossible");
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
            <Lightbulb className="h-6 w-6 text-primary" aria-hidden="true" />
            Recommandations
          </h1>
          <p className="text-sm text-muted-foreground">
            Actions suggérées à partir des coûts, de l'utilisation, du renouvellement, de la conduite et de la conformité.
          </p>
        </div>
        <Button variant="outline" onClick={exporter} disabled={visibles.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />
          Plan d'action Excel
        </Button>
      </div>

      {!d ? (
        <EtatChargement enCours={requete.isPending} erreur={requete.error} texte="Analyse du parc en cours…" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(["HAUTE", "MOYENNE", "BASSE"] as PrioriteRecommandation[]).map((p) => {
              const n = p === "HAUTE" ? d.nombreHaute : p === "MOYENNE" ? d.nombreMoyenne : d.nombreBasse;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={filtres.priorite === p}
                  onClick={() => setFiltres((f) => ({ ...f, priorite: f.priorite === p ? null : p }))}
                  className={cn("text-left", filtres.priorite === p && "rounded-xl ring-2 ring-primary")}
                >
                  <CarteChiffre titre={PRIORITES[p].libelle} valeur={n} classeValeur={n > 0 && p === "HAUTE" ? "text-badge-dangerFg" : undefined} />
                </button>
              );
            })}
          </div>

          {d.sourcesIndisponibles.length > 0 && (
            <p className="rounded-xl border bg-badge-warningBg px-4 py-3 text-sm text-badge-warningFg">
              Indicateurs non disponibles pour le moment : {d.sourcesIndisponibles.join(", ")}. Les recommandations correspondantes manquent.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={filtres.recherche}
              onChange={(e) => setFiltres((f) => ({ ...f, recherche: e.target.value }))}
              placeholder="Rechercher un véhicule, un conducteur…"
              className="h-9 w-64"
              aria-label="Rechercher"
            />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrer par domaine">
              {(Object.keys(DOMAINES) as DomaineRecommandation[])
                .filter((dom) => parDomaine[dom])
                .map((dom) => (
                  <button
                    key={dom}
                    type="button"
                    aria-pressed={filtres.domaine === dom}
                    onClick={() => setFiltres((f) => ({ ...f, domaine: f.domaine === dom ? null : dom }))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      filtres.domaine === dom ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                    )}
                  >
                    {DOMAINES[dom]} ({parDomaine[dom]})
                  </button>
                ))}
            </div>
          </div>

          {visibles.length === 0 ? (
            <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              {d.recommandations.length === 0 ? "Aucune recommandation : les indicateurs sont dans les clous." : "Aucune recommandation ne correspond aux filtres."}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibles.map((r) => (
                <li key={`${r.domaine}-${r.cible}-${r.idCible ?? "parc"}-${r.action}`} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Pastille libelle={PRIORITES[r.priorite].libelle} classes={PRIORITES[r.priorite].classes} />
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">{DOMAINES[r.domaine]}</span>
                      </div>
                      <p className="font-medium">{r.action}</p>
                      <p className="text-sm">
                        {r.cible === "VEHICULE" && r.idCible !== null ? (
                          <Link to={`/engins/${r.idCible}/fiche`} className="font-medium hover:underline">
                            {r.libelleCible}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.libelleCible}</span>
                        )}
                        {r.precision && <span className="text-muted-foreground"> · {r.precision}</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{r.justification}</p>
                    </div>
                    <Link to={r.lien} className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline">
                      Voir le détail <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Situation au {formatDate(d.date)}. Ce sont des suggestions calculées par des règles simples : la décision reste à la direction.
          </p>
        </>
      )}
    </div>
  );
}
