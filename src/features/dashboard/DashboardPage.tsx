import { useAuth } from "@/features/auth/useAuth";
import { TableauBordExploitation } from "@/features/dashboard/exploitation/TableauBordExploitation";
import { tableauDuRole } from "@/features/dashboard/metier/choix-tableau";
import { TableauBordAtelier } from "@/features/dashboard/metier/TableauBordAtelier";
import { TableauBordChantier } from "@/features/dashboard/metier/TableauBordChantier";
import { TableauBordFinances } from "@/features/dashboard/metier/TableauBordFinances";

/**
 * Tableau de bord : un par métier (pages par métier, 2026-09-30, choix
 * validé « Tableaux de bord par métier — dans ce lot »).
 *
 * - Direction (DG, responsable du parc, administrateur) et assistant du
 *   parc : tableau de bord d'exploitation (pilotage pour la direction).
 * - Chef et assistant maintenance : atelier (metier/TableauBordAtelier).
 * - Comptable : finances (metier/TableauBordFinances).
 * - Chef de chantier : ses chantiers (metier/TableauBordChantier).
 *
 * Chaque tableau de bord ne charge que les données de son métier (aucune
 * requête refusée par le serveur). Le choix est dans metier/choix-tableau.ts.
 */
export function DashboardPage() {
  const { session } = useAuth();
  switch (tableauDuRole(session?.role)) {
    case "atelier":
      return <TableauBordAtelier />;
    case "finances":
      return <TableauBordFinances />;
    case "chantier":
      return <TableauBordChantier />;
    default:
      return <TableauBordExploitation />;
  }
}
