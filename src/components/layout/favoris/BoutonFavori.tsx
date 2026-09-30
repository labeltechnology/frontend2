import { useLocation } from "react-router-dom";
import { Star } from "lucide-react";
import { useFavoris } from "@/components/layout/favoris/useFavoris";
import { NAV_ITEMS } from "@/routes/nav-config";
import { cn } from "@/lib/utils";

/** Étoile à côté du titre d'une page du menu : l'ajoute aux favoris (menu ★ de la barre). */
export function BoutonFavori() {
  const { pathname } = useLocation();
  const { estFavori, basculer } = useFavoris();
  const page = NAV_ITEMS.find((i) => i.to === pathname && i.to !== "/");
  if (!page) return null;
  const actif = estFavori(page.to);
  return (
    <button
      type="button"
      onClick={() => basculer(page.to)}
      aria-pressed={actif}
      aria-label={actif ? `Retirer « ${page.label} » des favoris` : `Ajouter « ${page.label} » aux favoris`}
      title={actif ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="rounded p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Star className={cn("h-5 w-5", actif && "fill-primary text-primary")} aria-hidden="true" />
    </button>
  );
}
