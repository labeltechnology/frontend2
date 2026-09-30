import { NavLink } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { useNonLus } from "@/features/messagerie/api";
import { cn } from "@/lib/utils";

/** Accès à la messagerie dans la barre de navigation, avec le nombre de messages non lus. */
export function BoutonMessagerieNav({ chemin }: { chemin: string }) {
  const { data: nonLus = 0 } = useNonLus(true);
  const libelle = nonLus > 0 ? `Messagerie, ${nonLus} message(s) non lu(s)` : "Messagerie";
  return (
    <NavLink
      to={chemin}
      title={libelle}
      aria-label={libelle}
      className={({ isActive }) =>
        cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "bg-sidebar-active text-primary" : "text-sidebar-text hover:bg-sidebar-chip hover:text-foreground",
        )
      }
    >
      <MessagesSquare className="h-[18px] w-[18px]" aria-hidden />
      {nonLus > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-badge-dangerFg px-1 text-center text-[10px] font-semibold leading-4 tabular-nums text-white">
          {nonLus > 99 ? "99+" : nonLus}
        </span>
      )}
    </NavLink>
  );
}
