import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "@/routes/nav-config";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Barre supérieure (direction Design "Graphite & Ambre", frontend2) : le
 * titre de la page courante, dérivé de NAV_ITEMS/la route active, et à
 * droite le sélecteur de thème (Clair / Sombre / Nuit vitrée). Le logo, le
 * menu, la recherche de page et le compte sont dans la barre flottante du
 * bas (voir barre-navigation/BarreNavigation.tsx, 2026-09-25). Elle reste
 * fixe au défilement : c'est <main> qui scrolle (voir AppLayout.tsx).
 *
 * Pas de cloche de notifications : elle ne correspondrait à aucune
 * fonctionnalité réelle (« UI morte »).
 */
function titrePageCourante(pathname: string): string {
  if (pathname === "/") return "Tableau de bord";
  // Le plus long préfixe correspondant : évite qu'une sous-route (ex. future "/engins/12")
  // ne tombe sur aucun titre.
  const item = [...NAV_ITEMS]
    .filter((i) => i.to !== "/" && pathname.startsWith(i.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return item?.label ?? "ParcAuto";
}

export function Topbar() {
  const { pathname } = useLocation();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border surface-verre px-5 md:px-7">
      <h1 className="truncate font-display text-lg font-semibold text-foreground">{titrePageCourante(pathname)}</h1>
      <ThemeToggle />
    </header>
  );
}
