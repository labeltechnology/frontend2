import { Link } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICONES_GROUPES } from "@/components/layout/barre-navigation/icones-groupes";
import type { ControleMenu } from "@/components/layout/barre-navigation/useMenuUnique";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/routes/nav-config";
import type { SectionNavigation } from "@/routes/navigation-groupes";

/**
 * Un groupe du menu dans la barre du bas : bouton « Parc & exploitation ▴ »
 * qui déroule ses pages VERS LE HAUT (la barre est collée au bas de
 * l'écran). Le groupe de la page courante et la page courante sont en
 * couleur primaire. Ouverture pilotée par la barre (`controle`) : un seul
 * menu ouvert à la fois ; non modal pour passer directement d'un groupe à
 * l'autre d'un seul clic.
 */
export function MenuGroupe({
  section,
  actif,
  pageCourante,
  controle,
}: {
  section: SectionNavigation;
  actif: boolean;
  pageCourante: NavItem | undefined;
  controle: ControleMenu;
}) {
  const Icone = ICONES_GROUPES[section.groupe.id];
  return (
    <DropdownMenu open={controle.open} onOpenChange={controle.onOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={section.groupe.libelle}
          className={cn(
            "group flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            actif ? "bg-sidebar-active text-primary" : "text-sidebar-text hover:bg-sidebar-chip hover:text-foreground",
            "data-[state=open]:bg-sidebar-chip data-[state=open]:text-foreground",
          )}
        >
          <Icone className="h-4 w-4 shrink-0 md:hidden" aria-hidden="true" />
          <span className="sr-only md:not-sr-only md:whitespace-nowrap">{section.groupe.libelle}</span>
          <ChevronUp
            className="hidden h-3.5 w-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180 md:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-60">
        {section.items.map((item) => {
          const courant = item.to === pageCourante?.to;
          return (
            <DropdownMenuItem key={item.to} asChild>
              <Link
                to={item.to}
                aria-current={courant ? "page" : undefined}
                className={cn("flex cursor-pointer items-center gap-2.5", courant && "font-medium text-primary")}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
