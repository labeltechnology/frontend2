import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Car, ChevronDown, LogOut } from "lucide-react";
import { libelleRole } from "@/lib/droits";
import { cn, initialesDepuisEmail } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/routes/nav-config";
import { entreesVisibles, groupeDuChemin, grouperNavigation, type SectionNavigation } from "@/routes/navigation-groupes";
import { useGroupesReplies } from "@/components/layout/useGroupesReplies";
import { useAuth } from "@/features/auth/useAuth";
import { AvatarInitiales } from "@/components/ui/avatar-initiales";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Barre latérale « Super Admin » (direction demandée le 2026-09-23 en
 * référence à sa.avidtemplates.com, remplace le rail d'icônes seules) :
 * colonne de 240 px, icône + libellé sur chaque entrée, même fond que les
 * cartes et séparée de la page par une bordure fine ; l'état actif est un
 * bloc bleu pâle avec texte et icône en couleur primaire. Comme dans le
 * template, « Paramètres » est épinglé en bas, au-dessus de l'identité de
 * l'utilisateur connecté.
 *
 * NAV_ITEMS reste la seule source de vérité pour la navigation et les gardes
 * de route (voir nav-config.ts).
 *
 * Groupes repliables (2026-09-24, « vérifier les menus et regrouper ») : les
 * entrées sont rangées sous 4 titres (GROUPES_NAV). Un clic sur un titre
 * replie ou déplie son groupe, choix mémorisé dans le navigateur ; arriver
 * sur une page rouvre son groupe. Le titre du groupe qui contient la page
 * active passe en couleur primaire, même replié.
 */
const CHEMIN_PARAMETRES = "/parametres";

function LienNavigation({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-active text-primary"
            : "text-sidebar-text hover:bg-sidebar-chip hover:text-foreground",
        )
      }
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function GroupeNavigation({
  section,
  replie,
  actif,
  onBasculer,
}: {
  section: SectionNavigation;
  replie: boolean;
  actif: boolean;
  onBasculer: () => void;
}) {
  const idListe = `nav-groupe-${section.groupe.id}`;
  return (
    <li>
      <button
        type="button"
        onClick={onBasculer}
        aria-expanded={!replie}
        aria-controls={idListe}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
          actif ? "text-primary" : "text-sidebar-textMuted",
        )}
      >
        <span className="truncate">{section.groupe.libelle}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", replie && "-rotate-90")} />
      </button>
      {!replie && (
        <ul id={idListe} className="space-y-0.5">
          {section.items.map((item) => (
            <li key={item.to}>
              <LienNavigation item={item} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function Sidebar() {
  const { session, seDeconnecter } = useAuth();
  const { pathname } = useLocation();
  const { estReplie, basculer, deplier } = useGroupesReplies();

  const items = entreesVisibles(NAV_ITEMS, session?.role);
  const parametres = items.find((item) => item.to === CHEMIN_PARAMETRES);
  // Paramètres est épinglé en bas : il ne fait partie d'aucun groupe affiché.
  const menu = items.filter((item) => item.to !== CHEMIN_PARAMETRES);
  const sections = grouperNavigation(menu);
  const groupeCourant = groupeDuChemin(pathname, menu);

  // Arriver sur une page (lien, adresse tapée, retour arrière) rouvre son groupe.
  useEffect(() => {
    if (groupeCourant) deplier(groupeCourant);
  }, [groupeCourant, deplier]);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border surface-verre-laterale md:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary">
          <Car className="h-[18px] w-[18px] text-primary-foreground" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-display text-sm font-bold text-foreground">ParcAuto</div>
          <div className="truncate text-[11px] text-sidebar-textMuted">Label Technology</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ul>
          {sections.map((section) => (
            <GroupeNavigation
              key={section.groupe.id}
              section={section}
              replie={estReplie(section.groupe.id)}
              actif={section.groupe.id === groupeCourant}
              onBasculer={() => basculer(section.groupe.id)}
            />
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {parametres && <LienNavigation item={parametres} />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={session?.email}
              aria-label="Menu utilisateur"
              className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-chip"
            >
              <AvatarInitiales initiales={initialesDepuisEmail(session?.email)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{session?.email}</span>
                <span className="block truncate text-xs text-sidebar-textMuted">{libelleRole(session?.role)}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel>
              {session?.email}
              <div className="text-xs font-normal text-muted-foreground">{libelleRole(session?.role)}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={seDeconnecter} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
