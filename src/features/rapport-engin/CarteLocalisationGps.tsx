import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { Loader2, MapPinOff, Satellite } from "lucide-react";
import { TileLayerAuthentifiee } from "@/features/cartographie/TileLayerAuthentifiee";
import { useDernieresPositions, useLocalisationVehicule } from "@/features/gps/api";
import { COULEUR_PAR_STATUT, iconePourStatut } from "@/features/gps/icone-statut";
import {
  etatLocalisation,
  HEURES_TRACE,
  libelleAnciennete,
  messageSansPosition,
  traceRecente,
  type EtatLocalisation,
} from "@/features/rapport-engin/localisation-gps";
import { CLASSES_NIVEAU } from "@/features/rapport-engin/presentation";
import { cn, formatDateTime, formatNombre } from "@/lib/utils";
import type { LocalisationVehicule } from "@/types/gps";

const ZOOM_VEHICULE = 15;

/** Suit le véhicule quand sa position change (rafraîchie toutes les 30 s), sans toucher au zoom choisi. */
function SuivreVehicule({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.panTo([latitude, longitude]);
  }, [map, latitude, longitude]);
  return null;
}

interface CarteLocalisationGpsProps {
  idEngin: number;
}

/**
 * Carte GPS de la rubrique « Localisation » du rapport véhicule (2026-09-28) :
 * dernière position transmise par le boîtier (repère à la couleur du statut,
 * comme la carte flotte de la page GPS), tracé des dernières heures, fonds
 * Plan / Satellite. Données : GET /api/gps/engins/{idEngin}/localisation
 * (ce véhicule seul, rafraîchi toutes les 30 s).
 * Véhicule sans boîtier actif ou sans position : message à la place de la carte.
 * Règles pures dans localisation-gps.ts.
 */
export function CarteLocalisationGps({ idEngin }: CarteLocalisationGpsProps) {
  const localisation = useLocalisationVehicule(idEngin);

  // « Maintenant » recalculé à chaque rafraîchissement : l'ancienneté affichée reste juste.
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => setMaintenant(new Date()), [localisation.dataUpdatedAt]);

  const etat = useMemo<EtatLocalisation | null>(
    () => (localisation.data ? etatLocalisation(localisation.data, maintenant) : null),
    [localisation.data, maintenant],
  );

  if (localisation.isLoading) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Recherche de la position GPS…
      </p>
    );
  }
  if (localisation.isError || !localisation.data || !etat) {
    return <MessageSansCarte texte="Position GPS indisponible pour le moment." />;
  }
  if (etat.type !== "position") {
    return <MessageSansCarte texte={messageSansPosition(etat)} />;
  }
  return <CartePosition vehicule={localisation.data} etat={etat} maintenant={maintenant} />;
}

function MessageSansCarte({ texte }: { texte: string }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
      <MapPinOff className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {texte}
    </p>
  );
}

function CartePosition({
  vehicule,
  etat,
  maintenant,
}: {
  vehicule: LocalisationVehicule;
  etat: Extract<EtatLocalisation, { type: "position" }>;
  maintenant: Date;
}) {
  const { point: position, ageMinutes, recente } = etat;
  const historique = useDernieresPositions(position.idDispositifGps);
  const refetchHistorique = historique.refetch;
  // Le tracé suit la dernière position : rechargé quand une NOUVELLE position arrive (pas au montage, déjà chargé).
  const horodatageVu = useRef(position.horodatage);
  useEffect(() => {
    if (horodatageVu.current === position.horodatage) return;
    horodatageVu.current = position.horodatage;
    void refetchHistorique();
  }, [refetchHistorique, position.horodatage]);
  const trace = useMemo(() => traceRecente(historique.data, maintenant), [historique.data, maintenant]);

  const centre: [number, number] = [position.latitude, position.longitude];
  const couleurTrace = COULEUR_PAR_STATUT[vehicule.statutEngin] ?? COULEUR_PAR_STATUT.EN_MISSION;

  return (
    <div className="space-y-1.5">
      {/* `isolate` : les calques Leaflet (z-index 400+) restent sous les fenêtres et panneaux de l'application. */}
      <div className="relative isolate h-52 overflow-hidden rounded-md border border-border">
        <MapContainer center={centre} zoom={ZOOM_VEHICULE} scrollWheelZoom={false} className="h-full w-full">
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Plan">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              {/* Tuiles relayées par notre backend (jeton jamais exposé) — voir ChantiersMap. */}
              <TileLayerAuthentifiee
                urlModele="/api/cartographie/tuiles-satellite/{z}/{x}/{y}.png"
                attribution='Imagerie satellite &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {trace.length > 0 && (
            <Polyline positions={trace} pathOptions={{ color: couleurTrace, weight: 3, opacity: 0.6, dashArray: "4 6" }} />
          )}
          <Marker position={centre} icon={iconePourStatut(vehicule.statutEngin, 18)}>
            <Popup>
              <div className="min-w-[160px] space-y-0.5 text-xs">
                <p className="text-sm font-medium">{vehicule.libelleVehicule}</p>
                <p>{formatDateTime(position.horodatage)}</p>
                <p>Vitesse : {formatNombre(position.vitesse, 1)} km/h</p>
                <p className="text-muted-foreground">Boîtier : {position.numeroSerie}</p>
              </div>
            </Popup>
          </Marker>
          <SuivreVehicule latitude={position.latitude} longitude={position.longitude} />
        </MapContainer>
      </div>

      <p className={cn("flex flex-wrap items-center gap-x-1.5 text-xs", recente ? "text-muted-foreground" : CLASSES_NIVEAU.avertissement.texte)}>
        <Satellite className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Position GPS {libelleAnciennete(ageMinutes)} ({formatDateTime(position.horodatage)})
          {position.vitesse > 0 && <> · {formatNombre(position.vitesse, 0)} km/h</>}
        </span>
        {!recente && <span className="font-medium">— position ancienne</span>}
      </p>
      {trace.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Pointillés : trajet des {HEURES_TRACE} dernières heures.</p>
      )}
    </div>
  );
}
