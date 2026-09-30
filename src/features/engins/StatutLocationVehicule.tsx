import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import type { StatutEngin } from "@/types/engin";

/**
 * Colonne « Statut / location » de la liste des véhicules (2026-09-25,
 * « fusionner le statut et locations ») : le statut, et en dessous la
 * location en cours s'il y en a une (véhicule loué à une société, ou véhicule
 * pris en location chez un prestataire).
 */
export function StatutLocationVehicule({
  statut,
  loueA,
  loueChez,
}: {
  statut: StatutEngin;
  /** Société à qui le véhicule est loué (contrat de location externe actif). */
  loueA?: string;
  /** Prestataire chez qui le véhicule est pris en location (contrat entrant actif). */
  loueChez?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <StatutBadge statut={statut} />
      {loueA && <Badge variant="warning">Loué à {loueA}</Badge>}
      {!loueA && loueChez && <Badge variant="default">En location chez {loueChez}</Badge>}
    </div>
  );
}
