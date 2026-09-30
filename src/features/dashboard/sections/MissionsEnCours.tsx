import { Route as RouteIcon } from "lucide-react";
import { CadreSection, EtatBloc } from "@/features/dashboard/sections/CadreSection";
import type { MissionSuivie } from "@/features/dashboard/indicateurs";
import { cn, formatDateTime } from "@/lib/utils";
import { identifiantVehicule } from "@/lib/vehicule";

const NOMBRE_VISIBLE = 6;

/**
 * Missions en cours : véhicule, motif, conducteur et avancement dans le
 * temps (du départ au retour prévu). Les retards passent en tête, en rouge,
 * avec le libellé « Retour dépassé ».
 */
export function MissionsEnCours({ missions, enChargement, enErreur }: { missions: MissionSuivie[]; enChargement: boolean; enErreur: boolean }) {
  const visibles = missions.slice(0, NOMBRE_VISIBLE);
  return (
    <CadreSection titre="Missions en cours" icone={RouteIcon} lien="/missions">
      {enChargement ? (
        <EtatBloc>Chargement…</EtatBloc>
      ) : enErreur ? (
        <EtatBloc erreur>Missions indisponibles.</EtatBloc>
      ) : missions.length === 0 ? (
        <EtatBloc>Aucune mission en cours.</EtatBloc>
      ) : (
        <ul className="space-y-3">
          {visibles.map(({ mission, progression, enRetard }) => (
            <li key={mission.idMission} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium text-foreground">{identifiantVehicule(mission.engin)}</span>
                  <span className="text-muted-foreground"> · {mission.motif}</span>
                </span>
                <span className={cn("shrink-0 text-xs", enRetard ? "font-semibold text-badge-dangerFg" : "text-muted-foreground")}>
                  {enRetard ? "Retour dépassé" : `${progression} %`}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={progression}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Avancement de la mission ${mission.motif}`}
              >
                <div className={cn("h-full rounded-full", enRetard ? "bg-badge-dangerFg" : "bg-primary")} style={{ width: `${progression}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {mission.conducteur.prenom} {mission.conducteur.nom} — retour prévu {formatDateTime(mission.dateFinPrevue)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {missions.length > NOMBRE_VISIBLE && (
        <p className="mt-3 text-xs text-muted-foreground">+ {missions.length - NOMBRE_VISIBLE} autre(s) mission(s) en cours.</p>
      )}
    </CadreSection>
  );
}
