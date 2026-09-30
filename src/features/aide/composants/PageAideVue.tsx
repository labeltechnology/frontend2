import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, CircleCheck, Info, Lock, MessageCircle, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PagePlacee } from "@/features/aide/centre-aide";
import { accessible } from "@/features/aide/centre-aide";
import { schemaParId } from "@/features/aide/contenu/schemas";
import { CaptureAideVue } from "@/features/aide/composants/CaptureAideVue";
import { SchemaAideVue } from "@/features/aide/composants/SchemaAideVue";
import { TexteAide } from "@/features/aide/composants/TexteAide";
import { VoteAideVue } from "@/features/aide/composants/VoteAideVue";
import { SuiviAide } from "@/features/aide/composants/SuiviAide";
import { cheminPage, LIBELLES_FREQUENCE } from "@/features/aide/liens-aide";
import { libelleRole, ROLES_PAR_CAPACITE } from "@/lib/droits";
import { formatDate } from "@/lib/utils";
import type { RoleLibelle } from "@/types/auth";
import type { PageAide, PageDepannage, PageGuide, PageTexte } from "@/types/aide";



interface PageAideVueProps {
  placee: PagePlacee;
  index: Map<string, PagePlacee>;
  role: RoleLibelle | undefined;
  /** Responsable de l'aide (capacité ADMINISTRER) : voit les emplacements de captures et le suivi. */
  responsable: boolean;
}

/** Une page du centre d'aide, avec le modèle fixe de son type (étape 4). */
export function PageAideVue({ placee, index, role, responsable }: PageAideVueProps) {
  const { page, rubrique, section } = placee;
  const autorise = accessible(page, role);

  return (
    <article className="space-y-6" aria-labelledby={`titre-${page.id}`}>
      <header className="space-y-2">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/aide" className="hover:text-foreground">Centre d'aide</Link>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <Link to={`/aide?rubrique=${rubrique.id}`} className="hover:text-foreground">{rubrique.titre}</Link>
          {section && (
            <>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              <span>{section.titre}</span>
            </>
          )}
        </nav>
        <h2 id={`titre-${page.id}`} className="font-display text-2xl font-semibold leading-tight">
          {page.titre}
        </h2>
        <p className="text-muted-foreground">{page.resume}</p>
        <div className="flex flex-wrap gap-1.5">
          {page.capacite && (
            <Badge variant={autorise ? "secondary" : "warning"} dot={false}>
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Réservé à : {ROLES_PAR_CAPACITE[page.capacite].map(libelleRole).join(", ")}
            </Badge>
          )}
          {page.type === "GUIDE" && (
            <Badge variant="outline" dot={false}>
              {LIBELLES_FREQUENCE[page.frequence]}
            </Badge>
          )}
        </div>
      </header>

      {page.type === "GUIDE" && <CorpsGuide page={page} responsable={responsable} />}
      {page.type === "TEXTE" && <CorpsTexte page={page} responsable={responsable} />}
      {page.type === "FAQ" && (
        <p className="rounded-lg border border-border bg-card p-4 leading-relaxed">
          <TexteAide texte={page.reponse} />
        </p>
      )}
      {page.type === "DEPANNAGE" && <CorpsDepannage page={page} index={index} />}
      {page.type === "REFERENCE" && <CorpsReference page={page} />}
      {page.type === "NOUVEAUTES" && (
        <ol className="space-y-5">
          {page.versions.map((v) => (
            <li key={v.date} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground">{formatDate(v.date)}</p>
              <p className="font-medium">{v.titre}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {v.points.map((point, i) => (
                  <li key={i}>
                    <TexteAide texte={point} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
      {page.type === "SUIVI" && (responsable ? <SuiviAide index={index} /> : <p className="text-sm text-muted-foreground">Page réservée au responsable de l'aide.</p>)}

      {page.voirAussi && page.voirAussi.length > 0 && (
        <Bloc titre="Voir aussi">
          <ul className="flex flex-wrap gap-2">
            {page.voirAussi.map((id) => {
              const cible = index.get(id);
              return cible ? (
                <li key={id}>
                  <Link
                    to={cheminPage(id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm hover:border-primary hover:text-primary"
                  >
                    {cible.page.titre}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </Bloc>
      )}

      {page.type !== "SUIVI" && (
        <footer className="space-y-3 border-t border-border pt-4">
          <VoteAideVue idPage={page.id} />
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Mis à jour le {formatDate(page.revision)}
            </span>
            <Link to={cheminPage("contact-support")} className="inline-flex items-center gap-1 hover:text-foreground">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Une question ? Contacter le support
            </Link>
          </p>
        </footer>
      )}
    </article>
  );
}

function Bloc({ titre, icone, children }: { titre: string; icone?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        {icone}
        {titre}
      </h3>
      {children}
    </section>
  );
}

function Illustrations({ schema, captures, responsable }: { schema?: string; captures?: PageGuide["captures"]; responsable: boolean }) {
  const s = schemaParId(schema);
  return (
    <>
      {s && <SchemaAideVue schema={s} />}
      {captures?.map((capture) => <CaptureAideVue key={capture.fichier} capture={capture} responsable={responsable} />)}
    </>
  );
}

function CorpsGuide({ page, responsable }: { page: PageGuide; responsable: boolean }) {
  return (
    <>
      <p className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          <strong>Objectif :</strong> {page.objectif}
        </span>
      </p>
      {page.avantDeCommencer && page.avantDeCommencer.length > 0 && (
        <Bloc titre="Avant de commencer">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {page.avantDeCommencer.map((texte, i) => (
              <li key={i}>
                <TexteAide texte={texte} />
              </li>
            ))}
          </ul>
        </Bloc>
      )}
      <Bloc titre="Étapes">
        <ol className="space-y-2">
          {page.etapes.map((etape, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-hidden="true">
                {i + 1}
              </span>
              <span className="pt-0.5">
                <TexteAide texte={etape} />
              </span>
            </li>
          ))}
        </ol>
      </Bloc>
      <p className="flex items-start gap-2 rounded-lg border border-badge-successFg/40 bg-badge-successBg p-3 text-sm text-badge-successFg">
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong>Résultat :</strong> <TexteAide texte={page.resultat} />
        </span>
      </p>
      <Illustrations schema={page.schema} captures={page.captures} responsable={responsable} />
      {page.bonASavoir && page.bonASavoir.length > 0 && (
        <Bloc titre="Bon à savoir" icone={<Info className="h-4 w-4 text-badge-infoFg" aria-hidden="true" />}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {page.bonASavoir.map((texte, i) => (
              <li key={i}>
                <TexteAide texte={texte} />
              </li>
            ))}
          </ul>
        </Bloc>
      )}
    </>
  );
}

function CorpsTexte({ page, responsable }: { page: PageTexte; responsable: boolean }) {
  return (
    <>
      {page.sections.map((section) => (
        <Bloc key={section.titre} titre={section.titre}>
          {section.paragraphes?.map((texte, i) => (
            <p key={i} className="text-sm leading-relaxed">
              <TexteAide texte={texte} />
            </p>
          ))}
          {section.liste && (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {section.liste.map((texte, i) => (
                <li key={i}>
                  <TexteAide texte={texte} />
                </li>
              ))}
            </ul>
          )}
          {section.tableau && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    {section.tableau.colonnes.map((c) => (
                      <th key={c} scope="col" className="px-3 py-2 text-left font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.tableau.lignes.map((ligne, i) => (
                    <tr key={i} className="border-t border-border">
                      {ligne.map((cellule, j) => (
                        <td key={j} className="px-3 py-2 align-top">
                          <TexteAide texte={cellule} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloc>
      ))}
      <Illustrations schema={page.schema} captures={page.captures} responsable={responsable} />
    </>
  );
}

function CorpsDepannage({ page, index }: { page: PageDepannage; index: Map<string, PagePlacee> }) {
  return (
    <>
      <Bloc titre="Symptôme">
        <p className="text-sm">
          <TexteAide texte={page.symptome} />
        </p>
        {page.message && (
          <p className="rounded-md border-l-4 border-badge-dangerFg bg-badge-dangerBg px-3 py-2 font-mono text-sm text-badge-dangerFg">
            {page.message}
          </p>
        )}
      </Bloc>
      <Bloc titre="Cause probable">
        <p className="text-sm">{page.cause}</p>
      </Bloc>
      <Bloc titre="Solution">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {page.solution.map((texte, i) => (
            <li key={i}>
              <TexteAide texte={texte} />
            </li>
          ))}
        </ol>
      </Bloc>
      <Bloc titre="Si le problème continue">
        <p className="text-sm">
          Notez le message exact et l'écran concerné, puis{" "}
          <Link to={cheminPage("contact-support")} className="font-medium text-primary hover:underline">
            {index.get("contact-support")?.page.titre.toLowerCase() ?? "contactez le support"}
          </Link>
          .
        </p>
      </Bloc>
    </>
  );
}

function CorpsReference({ page }: { page: Extract<PageAide, { type: "REFERENCE" }> }) {
  return (
    <div className="space-y-4">
      {page.articles.map((article) => (
        <details key={article.id} className="group rounded-lg border border-border bg-card p-4 open:shadow-sm">
          <summary className="cursor-pointer list-none font-medium">
            <span className="mr-2 inline-block transition group-open:rotate-90" aria-hidden="true">›</span>
            {article.titre}
            <span className="block pl-4 text-sm font-normal text-muted-foreground">{article.resume}</span>
          </summary>
          <div className="mt-3 space-y-3 pl-4 text-sm">
            {article.fonctionnalites.length > 0 && (
              <div>
                <p className="font-semibold">Ce qu'on peut faire</p>
                <ul className="list-disc space-y-1 pl-5">
                  {article.fonctionnalites.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {article.reglesCles.length > 0 && (
              <div>
                <p className="font-semibold">Règles appliquées</p>
                <ul className="list-disc space-y-1 pl-5">
                  {article.reglesCles.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {article.astuces && article.astuces.length > 0 && (
              <div>
                <p className="font-semibold">Astuces</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {article.astuces.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
