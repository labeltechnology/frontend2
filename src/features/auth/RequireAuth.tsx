import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import type { RoleLibelle } from "@/types/auth";

interface RequireAuthProps {
  children: ReactNode;
  /** Si fourni, restreint l'accès à ces rôles (règle 1.3 : accès limité au rôle). Omis = tout utilisateur authentifié. */
  rolesAutorises?: readonly RoleLibelle[];
}

/**
 * Garde de route : redirige vers /connexion si aucune session valide, et
 * vers /acces-refuse si le rôle courant ne fait pas partie de
 * {@code rolesAutorises}. Miroir côté frontend des {@code @PreAuthorize}
 * du backend — le backend reste la seule source de vérité en cas d'écart
 * (cette garde n'est qu'un confort d'UX, jamais un contrôle de sécurité).
 */
export function RequireAuth({ children, rolesAutorises }: RequireAuthProps) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/connexion" replace state={{ depuis: location }} />;
  }

  if (rolesAutorises && !rolesAutorises.includes(session.role)) {
    return <Navigate to="/acces-refuse" replace />;
  }

  return <>{children}</>;
}
