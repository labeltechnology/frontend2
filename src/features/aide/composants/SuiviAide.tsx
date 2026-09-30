import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Loader2, SearchX, ThumbsDown, ThumbsUp, TimerReset } from "lucide-react";
import { useStatistiquesAide } from "@/features/aide/api";
import { pagesARelire, type PagePlacee } from "@/features/aide/centre-aide";
import { CENTRE_AIDE } from "@/features/aide/contenu";
import { HABITUDES_MAINTENANCE, JOURS_AVANT_RELECTURE, SCENARIOS_TEST } from "@/features/aide/contenu/contact";
import { cheminPage } from "@/features/aide/liens-aide";
import { formatDateTime, formatDate } from "@/lib/utils";

/**
 * Suivi de l'aide pour son responsable (étape 7 « tester, maintenir et
 * mesurer ») : votes par page (les plus mal notées d'abord), recherches sans
 * résultat, pages à relire, protocole de test et habitudes de mise à jour.
 */
export function SuiviAide({ index }: { index: Map<string, PagePlacee> }) {
  const stats = useStatistiquesAide(true);
  const aRelire = useMemo(() => pagesARelire(CENTRE_AIDE, new Date(), JOURS_AVANT_RELECTURE), []);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <ThumbsDown className="h-4 w-4" aria-hidden="true" />
          Votes « Cet article vous a-t-il aidé ? »
        </h3>
        {stats.isLoading ? (
          <Chargement />
        ) : stats.isError ? (
          <p className="text-sm text-destructive">Statistiques indisponibles.</p>
        ) : stats.data && stats.data.pages.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Page</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Oui</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Non</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Derniers commentaires</th>
                </tr>
              </thead>
              <tbody>
                {stats.data.pages.map((p) => (
                  <tr key={p.idPage} className="border-t border-border align-top">
                    <td className="px-3 py-2">
                      {index.has(p.idPage) ? (
                        <Link to={cheminPage(p.idPage)} className="font-medium hover:text-primary">
                          {index.get(p.idPage)?.page.titre}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{p.idPage} (page supprimée)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-badge-successFg"><ThumbsUp className="h-3 w-3" aria-hidden="true" />{p.oui}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-badge-dangerFg"><ThumbsDown className="h-3 w-3" aria-hidden="true" />{p.non}</span>
                    </td>
                    <td className="px-3 py-2">
                      {p.commentaires.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ul className="space-y-1">
                          {p.commentaires.map((c, i) => (
                            <li key={i} className="text-xs">
                              « {c.texte} » <span className="text-muted-foreground">— {formatDateTime(c.date)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun vote pour l'instant.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <SearchX className="h-4 w-4" aria-hidden="true" />
          Recherches sans résultat
        </h3>
        <p className="text-xs text-muted-foreground">Créez la page manquante, ou ajoutez ce mot aux « motsCles » d'une page existante.</p>
        {stats.data && stats.data.recherchesSansResultat.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {stats.data.recherchesSansResultat.map((r) => (
              <li key={r.terme} className="rounded-full border border-border px-3 py-1 text-sm" title={`Dernière fois : ${formatDateTime(r.derniereDate)}`}>
                {r.terme} <span className="text-xs text-muted-foreground">× {r.nombre}</span>
              </li>
            ))}
          </ul>
        ) : (
          !stats.isLoading && <p className="text-sm text-muted-foreground">Aucune recherche sans résultat.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <TimerReset className="h-4 w-4" aria-hidden="true" />
          Pages à relire (révision de plus de {JOURS_AVANT_RELECTURE} jours)
        </h3>
        {aRelire.length === 0 ? (
          <p className="text-sm text-muted-foreground">Toutes les pages sont à jour.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {aRelire.map((p) => (
              <li key={p.id}>
                <Link to={cheminPage(p.id)} className="hover:text-primary">{p.titre}</Link>{" "}
                <span className="text-xs text-muted-foreground">({formatDate(p.revision)})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-2 flex items-center gap-2 font-semibold">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Tester l'aide avec 3 personnes
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Choisissez trois personnes qui ne connaissent pas le logiciel. Donnez une tâche à chacune et observez sans aider : elle doit réussir avec l'aide seule.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {SCENARIOS_TEST.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-2 font-semibold">Garder l'aide fiable</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {HABITUDES_MAINTENANCE.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Chargement() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Chargement…
    </p>
  );
}
