import { CircleMarker, Marker, Polyline, Popup, Tooltip } from "react-leaflet";
import { iconePourStatut } from "@/features/gps/icone-statut";
import { formatDuree } from "@/features/gps/trajet/periode";
import { formatDateTime, formatNombre } from "@/lib/utils";
import type { TrajetPeriode } from "@/types/carte-gps";

/** Au-delà, les positions ne sont plus dessinées une à une (seulement le tracé). */
const POSITIONS_DESSINEES_MAX = 300;

/**
 * Trajet d'un véhicule sur la carte (2026-09-30) : tracé, départ, dernière
 * position, et repères d'entrée (vert) / sortie (rouge) sur chaque chantier.
 */
export function CoucheTrajet({ trajet }: { trajet: TrajetPeriode }) {
  const points = trajet.positions;
  if (points.length === 0) return null;
  const trace = points.map((p) => [p.latitude, p.longitude] as [number, number]);
  const premiere = points[0];
  const derniere = points[points.length - 1];
  return (
    <>
      <Polyline positions={trace} pathOptions={{ color: "#2563eb", weight: 3 }} />
      {points.length <= POSITIONS_DESSINEES_MAX &&
        points.slice(1, -1).map((p, i) => (
          <CircleMarker
            key={`${p.horodatage}-${i}`}
            center={[p.latitude, p.longitude]}
            radius={3}
            pathOptions={{ color: "#2563eb", fillColor: "#ffffff", fillOpacity: 1, weight: 1.5 }}
          >
            <Popup>
              <p className="text-xs text-muted-foreground">{formatDateTime(p.horodatage)}</p>
              <p className="text-xs text-muted-foreground">Vitesse : {formatNombre(p.vitesse, 1)} km/h</p>
            </Popup>
          </CircleMarker>
        ))}
      <CircleMarker center={[premiere.latitude, premiere.longitude]} radius={7} pathOptions={{ color: "#ffffff", fillColor: "#2563eb", fillOpacity: 1, weight: 2 }}>
        <Tooltip>Départ — {formatDateTime(premiere.horodatage)}</Tooltip>
      </CircleMarker>
      <Marker position={[derniere.latitude, derniere.longitude]} icon={iconePourStatut("EN_MISSION", 18)}>
        <Popup>
          <p className="font-medium">{trajet.libelleVehicule ?? trajet.numeroSerie}</p>
          <p className="text-xs text-muted-foreground">Dernière position : {formatDateTime(derniere.horodatage)}</p>
          <p className="text-xs text-muted-foreground">Vitesse : {formatNombre(derniere.vitesse, 1)} km/h</p>
        </Popup>
      </Marker>
      {trajet.passages.map((p) => (
        <FragmentPassage key={`${p.idChantier}-${p.entree}`} passage={p} />
      ))}
    </>
  );
}

function FragmentPassage({ passage: p }: { passage: TrajetPeriode["passages"][number] }) {
  return (
    <>
      <CircleMarker center={[p.latitudeEntree, p.longitudeEntree]} radius={6} pathOptions={{ color: "#ffffff", fillColor: "#16a34a", fillOpacity: 1, weight: 2 }}>
        <Tooltip>
          Entrée « {p.nomChantier} » — {formatDateTime(p.entree)}
        </Tooltip>
      </CircleMarker>
      {!p.enCours && (
        <CircleMarker center={[p.latitudeSortie, p.longitudeSortie]} radius={6} pathOptions={{ color: "#ffffff", fillColor: "#dc2626", fillOpacity: 1, weight: 2 }}>
          <Tooltip>
            Sortie « {p.nomChantier} » — {formatDateTime(p.sortie)} ({formatDuree(p.dureeMinutes)} sur place)
          </Tooltip>
        </CircleMarker>
      )}
    </>
  );
}
