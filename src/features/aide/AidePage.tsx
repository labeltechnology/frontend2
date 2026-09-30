import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ListTree, Search, SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/useAuth";
import { signalerRechercheVide } from "@/features/aide/api";
import { indexerPages, toutesLesPages } from "@/features/aide/centre-aide";
import { AccueilAide } from "@/features/aide/composants/AccueilAide";
import { PageAideVue } from "@/features/aide/composants/PageAideVue";
import { SommaireAide } from "@/features/aide/composants/SommaireAide";
import { CENTRE_AIDE } from "@/features/aide/contenu";
import { cheminPage } from "@/features/aide/liens-aide";
import { indexerRecherche, motsRecherche, rechercher } from "@/features/aide/recherche-aide";
import { peut } from "@/lib/droits";
import type { IdRubriqueAide } from "@/types/aide";

const PAGES = toutesLesPages(CENTRE_AIDE);
const INDEX_PAGES = indexerPages(CENTRE_AIDE);
const INDEX_RECHERCHE = indexerRecherche(PAGES);
/** Délai avant de compter une recherche sans résultat (l'utilisateur a fini de taper). */
const DELAI_RECHERCHE_VIDE_MS = 1500;

/**
 * Centre d'aide (refonte du 2026-09-28, méthode « Créer l'aide en ligne ») :
 * recherche en haut de page, sommaire latéral (dans un panneau sur
 * téléphone), cinq rubriques, pages au modèle fixe, vote « Cet article vous
 * a-t-il aidé ? ». L'état est dans l'adresse (?page=, ?rubrique=, ?q=) :
 * chaque page a un lien direct, utilisé par le bouton « ? » et les liens
 * d'aide des formulaires. Contenu : features/aide/contenu/.
 */
export function AidePage() {
  const { session } = useAuth();
  const role = session?.role;
  const responsable = peut(role, "ADMINISTRER");
  const [params, setParams] = useSearchParams();
  const [sommaireOuvert, setSommaireOuvert] = useState(false);
  const [seulementMesTaches, setSeulementMesTaches] = useState(true);
  const haut = useRef<HTMLDivElement>(null);

  const idPage = params.get("page");
  const rubrique = params.get("rubrique") as IdRubriqueAide | null;
  const q = params.get("q") ?? "";
  const placee = idPage ? INDEX_PAGES.get(idPage) : undefined;
  const resultats = useMemo(() => (q.trim() ? rechercher(INDEX_RECHERCHE, q) : []), [q]);

  // Étape 7 : noter les recherches restées sans résultat, une fois la saisie terminée.
  const dejaSignales = useRef(new Set<string>());
  useEffect(() => {
    const terme = q.trim();
    if (motsRecherche(terme).length === 0 || resultats.length > 0 || dejaSignales.current.has(terme)) return;
    const minuterie = window.setTimeout(() => {
      dejaSignales.current.add(terme);
      void signalerRechercheVide(terme);
    }, DELAI_RECHERCHE_VIDE_MS);
    return () => window.clearTimeout(minuterie);
  }, [q, resultats.length]);

  useEffect(() => {
    haut.current?.scrollIntoView({ block: "start" });
  }, [idPage, rubrique]);

  const changerRecherche = (valeur: string) => {
    const suivants = new URLSearchParams(params);
    if (valeur) suivants.set("q", valeur);
    else suivants.delete("q");
    setParams(suivants, { replace: true });
  };

  const sommaire = (fermer?: () => void) => (
    <SommaireAide
      centre={CENTRE_AIDE}
      idPageCourante={placee?.page.id ?? null}
      role={role}
      seulementMesTaches={seulementMesTaches}
      responsable={responsable}
      onNaviguer={() => {
        changerRecherche("");
        fermer?.();
      }}
    />
  );

  return (
    <div ref={haut} className="space-y-6 scroll-mt-4">
      <header className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-5 md:p-7">
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">
            <Link to="/aide" onClick={() => changerRecherche("")}>Centre d'aide</Link>
          </h1>
          <p className="text-muted-foreground">Comment faire ? Tapez une tâche, un mot ou le message d'erreur que vous voyez.</p>
        </div>
        <div className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={q}
            onChange={(e) => changerRecherche(e.target.value)}
            placeholder="Ex. : faire un plein, mission refusée, rapport PDF…"
            className="h-11 pl-10 pr-10 text-base"
            aria-label="Rechercher dans l'aide"
          />
          {q && (
            <button type="button" onClick={() => changerRecherche("")} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label="Effacer la recherche">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-7rem)] space-y-4 overflow-y-auto pr-1">
            <FiltreRole actif={seulementMesTaches} onChange={setSeulementMesTaches} />
            {sommaire()}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setSommaireOuvert(true)}>
              <ListTree className="h-4 w-4" />
              Sommaire
            </Button>
            <Sheet open={sommaireOuvert} onOpenChange={setSommaireOuvert}>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Sommaire de l'aide</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <FiltreRole actif={seulementMesTaches} onChange={setSeulementMesTaches} />
                  {sommaire(() => setSommaireOuvert(false))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <section aria-label="Contenu de l'aide" className="rounded-2xl border border-border bg-card p-5 md:p-7">
            {q.trim() ? (
              <ResultatsRecherche q={q} resultats={resultats.filter((r) => r.page.type !== "SUIVI" || responsable)} onChoisir={() => changerRecherche("")} />
            ) : placee && (placee.page.type !== "SUIVI" || responsable) ? (
              <PageAideVue placee={placee} index={INDEX_PAGES} role={role} responsable={responsable} />
            ) : idPage ? (
              <p className="text-sm text-muted-foreground">
                Cette page d'aide n'existe pas ou plus. <Link to="/aide" className="text-primary hover:underline">Revenir au centre d'aide</Link>.
              </p>
            ) : (
              <AccueilAide centre={CENTRE_AIDE} role={role} rubrique={rubrique} responsable={responsable} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FiltreRole({ actif, onChange }: { actif: boolean; onChange: (actif: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
      <span>Seulement mes tâches</span>
      <Switch checked={actif} onCheckedChange={onChange} aria-label="Afficher seulement les tâches permises à mon rôle" />
    </label>
  );
}

function ResultatsRecherche({ q, resultats, onChoisir }: { q: string; resultats: ReturnType<typeof rechercher>; onChoisir: () => void }) {
  if (resultats.length === 0) {
    return (
      <div className="space-y-3 text-center">
        <SearchX className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-medium">Aucune page ne correspond à « {q} ».</p>
        <p className="text-sm text-muted-foreground">Essayez un autre mot, ou le texte exact du message d'erreur. Votre recherche est notée pour compléter l'aide.</p>
        <Link to={cheminPage("contact-support")} onClick={onChoisir} className="inline-block text-sm font-medium text-primary hover:underline">
          Contacter le support
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground" role="status">
        {resultats.length} résultat{resultats.length > 1 ? "s" : ""} pour « {q} »
      </p>
      <ul className="divide-y divide-border">
        {resultats.map(({ page, rubrique, section }) => (
          <li key={page.id}>
            <Link to={cheminPage(page.id)} onClick={onChoisir} className="block rounded-md px-2 py-3 hover:bg-muted/60">
              <span className="text-xs text-muted-foreground">
                {rubrique.titre}
                {section ? ` · ${section.titre}` : ""}
              </span>
              <span className="block font-medium">{page.titre}</span>
              <span className="block text-sm text-muted-foreground">{page.resume}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
