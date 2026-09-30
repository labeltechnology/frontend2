import { Link } from "react-router-dom";
import { Clock, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFavoris, useRecents } from "@/components/layout/favoris/useFavoris";
import type { ControleMenu } from "@/components/layout/barre-navigation/useMenuUnique";
import type { NavItem } from "@/routes/nav-config";

/**
 * Menu ★ de la barre (2026-09-30) : pages favorites (étoile à côté du titre
 * de chaque page) et pages ouvertes récemment, fiches comprises. Seules les
 * pages autorisées au rôle sont proposées.
 */
export function MenuFavoris({ pages, controle }: { pages: NavItem[]; controle: ControleMenu }) {
  const { favoris } = useFavoris();
  const recents = useRecents();
  const pagesFavorites = favoris.map((c) => pages.find((p) => p.to === c)).filter((p): p is NavItem => Boolean(p));
  const autorise = (chemin: string) => pages.some((p) => chemin === p.to || (p.to !== "/" && chemin.startsWith(`${p.to}/`)) || chemin.startsWith(`${p.to}?`));
  const recentsVisibles = recents.filter((r) => autorise(r.chemin));

  return (
    <DropdownMenu open={controle.open} onOpenChange={controle.onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Favoris et pages récentes"
          title="Favoris et pages récentes"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sidebar-text transition-colors hover:bg-sidebar-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-chip"
        >
          <Star className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" sideOffset={10} className="w-72">
        <DropdownMenuLabel>Favoris</DropdownMenuLabel>
        {pagesFavorites.length === 0 && (
          <p className="px-2 pb-2 text-xs text-muted-foreground">Cliquez sur l'étoile à côté du titre d'une page pour la retrouver ici.</p>
        )}
        {pagesFavorites.map((p) => (
          <DropdownMenuItem key={p.to} asChild>
            <Link to={p.to} className="flex cursor-pointer items-center gap-2.5">
              <p.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{p.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Récemment ouverts</DropdownMenuLabel>
        {recentsVisibles.length === 0 && <p className="px-2 pb-2 text-xs text-muted-foreground">Aucune page pour l'instant.</p>}
        {recentsVisibles.map((r) => (
          <DropdownMenuItem key={r.chemin} asChild>
            <Link to={r.chemin} className="flex cursor-pointer items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{r.libelle}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
