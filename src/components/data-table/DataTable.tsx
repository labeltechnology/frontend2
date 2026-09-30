import { useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TAILLES_PAGE,
  basculerTri,
  filtrerLignes,
  paginer,
  pastillesFiltre,
  rechercherLignes,
  texteCompteur,
  trierLignes,
  type OptionFiltre,
  type ValeurTri,
} from "@/components/data-table/liste";
import { useEtatListe } from "@/components/data-table/useEtatListe";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Clé unique de la colonne (n'a pas besoin de correspondre à un champ de T). */
  key: string;
  header: ReactNode;
  render: (ligne: T) => ReactNode;
  className?: string;
  /** Valeur de tri : la colonne devient triable (clic sur son titre). */
  sortValue?: (ligne: T) => ValeurTri;
  /** Libellé sur téléphone quand `header` n'est pas un simple texte. */
  libelleMobile?: string;
  /** Sur téléphone : « titre » = en tête de la carte, « masque » = non affichée. */
  mobile?: "titre" | "masque";
}

/** Filtre rapide en pastilles au-dessus de la liste (ex. par statut). */
export interface FiltreRapide<T> {
  valeur: (ligne: T) => string;
  options: OptionFiltre[];
  libelleTous?: string;
  /** Nom du filtre pour les lecteurs d'écran (« Filtrer par statut »). */
  libelle?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[] | undefined;
  /** Extrait une clé React stable pour chaque ligne. */
  getRowKey: (ligne: T) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  onRowClick?: (ligne: T) => void;
  /** Rendu optionnel d'actions par ligne, ajouté en dernière colonne. */
  rowActions?: (ligne: T) => ReactNode;
  /** Clé de mémoire : tri, page et filtre gardés d'une visite à l'autre (2026-09-30). */
  cleMemoire?: string;
  filtreRapide?: FiltreRapide<T>;
  /** Pour le compteur : [singulier, pluriel], ex. ["véhicule", "véhicules"]. */
  libelles?: readonly [string, string];
  /** Champ de recherche au-dessus de la liste ; `?recherche=` dans l'adresse le pré-remplit (recherche globale). */
  recherche?: { texte: (ligne: T) => string; placeholder?: string };
}

const LIGNES_SQUELETTE = 5;

/**
 * Table générique réutilisée par tous les modules (liste Engins,
 * Conducteurs, Missions, ...) : chaque module ne fournit que sa
 * configuration de colonnes et ses données typées, plutôt que de
 * réimplémenter l'affichage table/chargement/erreur/vide à chaque écran.
 *
 * Ergonomie (2026-09-30) : tri par colonne (`sortValue`), filtre rapide en
 * pastilles, pagination avec compteur, état gardé (`cleMemoire`), et sur
 * téléphone une carte par ligne au lieu d'un tableau qui déborde. Les
 * règles sont dans liste.ts.
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading,
  isError,
  errorMessage = "Impossible de charger les données.",
  emptyMessage = "Aucun élément à afficher.",
  onRowClick,
  rowActions,
  cleMemoire,
  filtreRapide,
  libelles,
  recherche,
}: DataTableProps<T>) {
  const { etat, modifier } = useEtatListe(cleMemoire);
  const [parametres] = useSearchParams();
  const [terme, setTerme] = useState(() => parametres.get("recherche") ?? "");
  const nombreColonnes = columns.length + (rowActions ? 1 : 0);

  const trouvees = useMemo(
    () => (recherche && terme.trim() ? rechercherLignes(data ?? [], recherche.texte, terme) : (data ?? [])),
    [data, recherche, terme],
  );
  const pastilles = useMemo(
    () => (filtreRapide ? pastillesFiltre(trouvees, filtreRapide.valeur, filtreRapide.options, etat.filtre, filtreRapide.libelleTous) : []),
    [filtreRapide, trouvees, etat.filtre],
  );
  const vue = useMemo(() => {
    let lignes = trouvees;
    if (filtreRapide) lignes = filtrerLignes(lignes, filtreRapide.valeur, etat.filtre);
    const colonneTri = etat.tri ? columns.find((c) => c.key === etat.tri!.cle && c.sortValue) : undefined;
    if (colonneTri && etat.tri) lignes = trierLignes(lignes, colonneTri.sortValue!, etat.tri.sens);
    return paginer(lignes, etat.page, etat.taillePage);
  }, [trouvees, filtreRapide, etat, columns]);

  const pret = !isLoading && !isError;
  const vide = pret && vue.total === 0;
  const messageVide = data && data.length > 0 ? (terme.trim() ? `Aucun résultat pour « ${terme.trim()} ».` : "Aucun élément pour ce filtre.") : emptyMessage;
  const ouvrirAuClavier = (e: KeyboardEvent, ligne: T) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(ligne);
    }
  };
  const colonneTitre = columns.find((c) => c.mobile === "titre") ?? columns[0];

  return (
    <div className="space-y-3">
      {recherche && (
        <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            data-recherche-liste
            value={terme}
            onChange={(e) => {
              setTerme(e.target.value);
              modifier({ page: 0 });
            }}
            placeholder={recherche.placeholder ?? "Rechercher dans la liste…"}
            aria-label="Rechercher dans la liste (touche /)"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
          />
          <kbd className="hidden rounded border px-1.5 text-[10px] sm:inline">/</kbd>
        </label>
      )}
      {filtreRapide && pastilles.length > 1 && (
        <div role="group" aria-label={filtreRapide.libelle ?? "Filtre rapide"} className="flex flex-wrap gap-2">
          {pastilles.map((p) => {
            const actif = (etat.filtre ?? "") === p.valeur;
            return (
              <button
                key={p.valeur || "tous"}
                type="button"
                aria-pressed={actif}
                onClick={() => modifier({ filtre: p.valeur || null, page: 0 })}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  actif ? "border-primary bg-sidebar-active text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {p.libelle}
                <span className="tabular-nums opacity-80">{p.nombre}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Écran large : tableau. */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((colonne) => {
                const trie = etat.tri?.cle === colonne.key ? etat.tri.sens : null;
                return (
                  <TableHead
                    key={colonne.key}
                    className={colonne.className}
                    aria-sort={colonne.sortValue ? (trie === "asc" ? "ascending" : trie === "desc" ? "descending" : "none") : undefined}
                  >
                    {colonne.sortValue ? (
                      <button
                        type="button"
                        onClick={() => modifier({ tri: basculerTri(etat.tri, colonne.key), page: 0 })}
                        className={cn(
                          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          trie && "text-foreground",
                        )}
                        title="Trier"
                      >
                        {colonne.header}
                        {trie === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : trie === "desc" ? (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      colonne.header
                    )}
                  </TableHead>
                );
              })}
              {rowActions && <TableHead className="w-0 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: LIGNES_SQUELETTE }).map((_, index) => (
                <TableRow key={`squelette-${index}`}>
                  {Array.from({ length: nombreColonnes }).map((__, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && isError && (
              <TableRow>
                <TableCell colSpan={nombreColonnes} className="h-24 text-center text-destructive">
                  {errorMessage}
                </TableCell>
              </TableRow>
            )}

            {vide && (
              <TableRow>
                <TableCell colSpan={nombreColonnes} className="h-24 text-center text-muted-foreground">
                  {messageVide}
                </TableCell>
              </TableRow>
            )}

            {pret &&
              vue.lignes.map((ligne) => (
                <TableRow
                  key={getRowKey(ligne)}
                  onClick={onRowClick ? () => onRowClick(ligne) : undefined}
                  onKeyDown={onRowClick ? (e) => ouvrirAuClavier(e, ligne) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={onRowClick ? "cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none" : undefined}
                >
                  {columns.map((colonne) => (
                    <TableCell key={colonne.key} className={colonne.className}>
                      {colonne.render(ligne)}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {rowActions(ligne)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Téléphone : une carte par ligne. */}
      <div className="space-y-2 md:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        {!isLoading && isError && <p className="rounded-md border p-4 text-center text-sm text-destructive">{errorMessage}</p>}
        {vide && <p className="rounded-md border p-4 text-center text-sm text-muted-foreground">{messageVide}</p>}
        {pret &&
          vue.lignes.map((ligne) => (
            <div
              key={getRowKey(ligne)}
              onClick={onRowClick ? () => onRowClick(ligne) : undefined}
              onKeyDown={onRowClick ? (e) => ouvrirAuClavier(e, ligne) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
              className={cn("rounded-lg border bg-card p-3", onRowClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-semibold">{colonneTitre.render(ligne)}</div>
                {rowActions && <div onClick={(e) => e.stopPropagation()}>{rowActions(ligne)}</div>}
              </div>
              <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                {columns
                  .filter((c) => c !== colonneTitre && c.mobile !== "masque")
                  .map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-muted-foreground">{c.libelleMobile ?? (typeof c.header === "string" ? c.header : "")}</dt>
                      <dd className="min-w-0 break-words">{c.render(ligne)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
      </div>

      {pret && vue.total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums" aria-live="polite">
            {texteCompteur(vue, libelles)}
          </span>
          {vue.total > TAILLES_PAGE[0] && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <span className="hidden sm:inline">Lignes par page</span>
                <select
                  value={etat.taillePage}
                  onChange={(e) => modifier({ taillePage: Number(e.target.value), page: 0 })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-foreground"
                  aria-label="Lignes par page"
                >
                  {TAILLES_PAGE.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => modifier({ page: vue.page - 1 })}
                disabled={vue.page === 0}
                aria-label="Page précédente"
                className="flex h-8 w-8 items-center justify-center rounded-md border hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="tabular-nums text-foreground">
                {vue.page + 1} / {vue.pages}
              </span>
              <button
                type="button"
                onClick={() => modifier({ page: vue.page + 1 })}
                disabled={vue.page >= vue.pages - 1}
                aria-label="Page suivante"
                className="flex h-8 w-8 items-center justify-center rounded-md border hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
