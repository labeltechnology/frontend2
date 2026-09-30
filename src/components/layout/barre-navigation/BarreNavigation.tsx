import { MenuFavoris } from "@/components/layout/favoris/MenuFavoris";
import { NavLink, useLocation } from "react-router-dom";
import { Car, LayoutDashboard } from "lucide-react";
import { MenuGroupe } from "@/components/layout/barre-navigation/MenuGroupe";
import { MenuUtilisateur } from "@/components/layout/barre-navigation/MenuUtilisateur";
import { RecherchePage } from "@/components/layout/barre-navigation/RecherchePage";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { BoutonMessagerieNav } from "@/features/messagerie/BoutonMessagerieNav";
import { BoutonAideContextuelle } from "@/features/aide/BoutonAideContextuelle";
import { useMenuUnique } from "@/components/layout/barre-navigation/useMenuUnique";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/routes/nav-config";
import { entreeDuChemin, entreesVisibles, grouperNavigation } from "@/routes/navigation-groupes";
import { TemoinEnDirect } from "@/features/temps-reel/TemoinEnDirect";

const CHEMIN_ACCUEIL = "/";
const CHEMIN_PARAMETRES = "/parametres";
const CHEMIN_MESSAGERIE = "/messagerie";

/**
 * Barre de navigation flottante, centrée en bas de l'écran (2026-09-25,
 * d'après la maquette fournie par l'utilisateur ; remplace la barre
 * latérale). De gauche à droite : logo, « Tableau de bord », un menu par
 * groupe (GROUPES_NAV) qui se déroule vers le haut, puis la loupe (recherche
 * de page), le menu ★ (favoris et récents, 2026-09-30), le bouton « ? » d'aide contextuelle (2026-09-28), le choix du thème (repris de l'ancienne barre du haut,
 * supprimée le 2026-09-25) et l'avatar (compte, Paramètres, déconnexion).
 *
 * NAV_ITEMS (routes/nav-config.ts) reste la seule source de vérité : entrées,
 * groupes et rôles — les gardes de route lisent la même configuration.
 * Petit écran : les groupes n'affichent que leur pictogramme.
 */
export function BarreNavigation() {
  const { session } = useAuth();
  const { pathname } = useLocation();
  // Un seul menu ouvert à la fois (groupes, thème, avatar).
  const { controle } = useMenuUnique();

  const visibles = entreesVisibles(NAV_ITEMS, session?.role);
  const accueil = visibles.find((item) => item.to === CHEMIN_ACCUEIL);
  const parametres = visibles.find((item) => item.to === CHEMIN_PARAMETRES);
  const messagerie = visibles.find((item) => item.to === CHEMIN_MESSAGERIE);
  // Tableau de bord (lien direct), Messagerie (bouton avec pastille des non-lus) et Paramètres
  // (menu de l'avatar) sont hors des menus de groupe.
  const horsGroupes = [accueil, parametres, messagerie];
  const sections = grouperNavigation(visibles.filter((item) => !horsGroupes.includes(item)));
  const pageCourante = entreeDuChemin(pathname, visibles);

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 pointer-events-none"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border surface-verre px-2 py-1.5 shadow-lg">
        <span className="relative mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary" title="ParcAuto">
          <Car className="h-[18px] w-[18px] text-primary-foreground" aria-hidden="true" />
          <span className="sr-only">ParcAuto</span>
          <TemoinEnDirect className="absolute -right-0.5 -top-0.5" />
        </span>

        {accueil && (
          <NavLink
            to={accueil.to}
            end
            title={accueil.label}
            className={({ isActive }) =>
              cn(
                "flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "bg-sidebar-active text-primary" : "text-sidebar-text hover:bg-sidebar-chip hover:text-foreground",
              )
            }
          >
            <LayoutDashboard className="h-4 w-4 md:hidden" aria-hidden="true" />
            <span className="sr-only md:not-sr-only md:whitespace-nowrap">{accueil.label}</span>
          </NavLink>
        )}

        {sections.map((section) => (
          <MenuGroupe
            key={section.groupe.id}
            section={section}
            actif={pageCourante?.groupe === section.groupe.id && pageCourante !== accueil && pageCourante !== parametres}
            pageCourante={pageCourante}
            controle={controle(`groupe-${section.groupe.id}`)}
          />
        ))}

        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
        <MenuFavoris pages={visibles} controle={controle("favoris")} />
        {messagerie && <BoutonMessagerieNav chemin={messagerie.to} />}
        <RecherchePage pages={visibles} />
        <BoutonAideContextuelle />
        <ThemeToggle cote="top" ouvert={controle("theme").open} onOuvertChange={controle("theme").onOpenChange} />
        <span className="ml-1 shrink-0">
          <MenuUtilisateur parametres={parametres} controle={controle("utilisateur")} />
        </span>
      </div>
    </nav>
  );
}
