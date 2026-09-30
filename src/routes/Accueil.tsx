import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { pageAccueil, pageVisible } from "@/routes/acces-pages";
import { RouteGardee } from "@/routes/RouteGardee";

/**
 * Page d'arrivée « / » (2026-09-30, pages par métier) : le tableau de bord
 * pour les profils du site ; le conducteur, qui n'a pas de tableau de bord
 * sur le site, arrive sur la messagerie (première page permise).
 */
export function Accueil({ tableauDeBord }: { tableauDeBord: ReactNode }) {
  const { session } = useAuth();
  if (session && !pageVisible(session.role, "/")) {
    return <Navigate to={pageAccueil(session.role)} replace />;
  }
  return <RouteGardee chemin="/">{tableauDeBord}</RouteGardee>;
}
