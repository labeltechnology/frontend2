import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { rolesPourChemin } from "@/routes/nav-config";

interface RouteGardeeProps {
  /** Chemin de l'entrée de menu dont la page (et ses sous-pages) reprend les rôles, ex. « /types-engin ». */
  chemin: string;
  children: ReactNode;
}

/**
 * Garde de route alimentée par nav-config.ts : les rôles ne sont plus
 * recopiés dans App.tsx, ils sont lus sur l'entrée de menu correspondante.
 * Changer un rôle dans NAV_ITEMS change donc à la fois le lien et la garde.
 * Rappel : confort d'UX uniquement, le backend (@PreAuthorize) reste la
 * seule barrière de sécurité.
 */
export function RouteGardee({ chemin, children }: RouteGardeeProps) {
  return <RequireAuth rolesAutorises={rolesPourChemin(chemin)}>{children}</RequireAuth>;
}
