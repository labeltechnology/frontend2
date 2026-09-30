import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { accessible, tachesPrioritaires } from "@/features/aide/centre-aide";
import { cheminPage, LIBELLES_FREQUENCE } from "@/features/aide/liens-aide";
import { iconeAide } from "@/features/aide/icones-aide";
import { pageNouveautes } from "@/features/aide/contenu/contact";
import { formatDate } from "@/lib/utils";
import type { RoleLibelle } from "@/types/auth";
import type { IdRubriqueAide, PageAide, RubriqueAide } from "@/types/aide";

/**
 * Accueil du centre d'aide : les cinq rubriques, les tâches les plus utiles
 * pour le rôle connecté (étape 2 : les 20 % de tâches qui couvrent 80 % des
 * usages) et la dernière nouveauté. Avec « rubrique », liste ses pages.
 */
export function AccueilAide({
  centre,
  role,
  rubrique,
  responsable,
}: {
  centre: RubriqueAide[];
  role: RoleLibelle | undefined;
  rubrique: IdRubriqueAide | null;
  responsable: boolean;
}) {
  const choisie = centre.find((r) => r.id === rubrique);
  if (choisie) return <VueRubrique rubrique={choisie} role={role} responsable={responsable} />;

  const taches = tachesPrioritaires(centre, role);
  const derniere = pageNouveautes.versions[0];
  return (
    <div className="space-y-8">
      <section aria-labelledby="aide-rubriques" className="space-y-3">
        <h2 id="aide-rubriques" className="sr-only">Rubriques</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {centre.map((r) => {
            const Icone = iconeAide(r.icone);
            const nombre = r.pages.length + r.sections.reduce((t, s) => t + s.pages.length, 0);
            return (
              <Link
                key={r.id}
                to={`/aide?rubrique=${r.id}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-sm"
              >
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icone className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="font-display font-semibold">{r.titre}</p>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{nombre} pages</p>
              </Link>
            );
          })}
        </div>
      </section>

      {taches.length > 0 && (
        <section aria-labelledby="aide-taches" className="space-y-3">
          <h2 id="aide-taches" className="font-display text-lg font-semibold">Vos tâches les plus courantes</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {taches.map((g) => (
              <li key={g.id}>
                <Link to={cheminPage(g.id)} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/60">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{g.titre}</span>
                    <span className="text-xs text-muted-foreground">{LIBELLES_FREQUENCE[g.frequence]}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {derniere && (
        <Link to={cheminPage(pageNouveautes.id)} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 hover:border-primary/60">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <span>
            <span className="block text-xs text-muted-foreground">Nouveautés du {formatDate(derniere.date)}</span>
            <span className="font-medium">{derniere.titre}</span>
          </span>
        </Link>
      )}
    </div>
  );
}

function CartePage({ page, role }: { page: PageAide; role: RoleLibelle | undefined }) {
  return (
    <li>
      <Link to={cheminPage(page.id)} className="block rounded-lg border border-border bg-card p-3 hover:border-primary/60">
        <span className="block font-medium">{page.titre}</span>
        <span className="block text-sm text-muted-foreground">{page.resume}</span>
        {!accessible(page, role) && <span className="mt-1 block text-xs text-muted-foreground">Réservé à d'autres rôles</span>}
      </Link>
    </li>
  );
}

function VueRubrique({ rubrique, role, responsable }: { rubrique: RubriqueAide; role: RoleLibelle | undefined; responsable: boolean }) {
  const Icone = iconeAide(rubrique.icone);
  const visible = (p: PageAide) => p.type !== "SUIVI" || responsable;
  return (
    <div className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold">{rubrique.titre}</h2>
          <p className="text-muted-foreground">{rubrique.description}</p>
        </div>
      </header>
      {rubrique.pages.filter(visible).length > 0 && (
        <ul className="grid gap-2 md:grid-cols-2">
          {rubrique.pages.filter(visible).map((p) => <CartePage key={p.id} page={p} role={role} />)}
        </ul>
      )}
      {rubrique.sections.map((section) => {
        const IconeSection = iconeAide(section.icone);
        return (
          <section key={section.id} className="space-y-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <IconeSection className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {section.titre}
            </h3>
            {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
            <ul className="grid gap-2 md:grid-cols-2">
              {section.pages.map((p) => <CartePage key={p.id} page={p} role={role} />)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
