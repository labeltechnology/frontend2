import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { useEnginPhotos } from "@/features/engins/photos-api";
import { useDernieresPositions, useDispositifsGps, usePositionsFlotte } from "@/features/gps/api";
import { COULEUR_PAR_STATUT, iconePourStatut } from "@/features/gps/icone-statut";
import { useZones } from "@/features/zones/api";
import { formatDateTime, formatNombre } from "@/lib/utils";
import type { PositionFlotte } from "@/types/gps";

// Centre par défaut (Antananarivo) tant qu'aucune position n'est encore connue —
// la carte se recentre automatiquement dès que des données arrivent (voir FitBounds).
const CENTRE_PAR_DEFAUT: [number, number] = [-18.8792, 47.5079];
const ZOOM_PAR_DEFAUT = 6;

/** Recentre/ajuste le zoom de la carte sur un ensemble de points dès qu'il change. */
function AjusterVue({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    }
  }, [map, points]);
  return null;
}

/** Superpose les zones géographiques actives (règle 7.2/7.4) — cercles et polygones. */
function CoucheZones() {
  const { data: zones } = useZones();
  return (
    <>
      {zones
        ?.filter((zone) => zone.actif)
        .map((zone) => {
          const couleur = zone.type === "INTERDITE" ? "#dc2626" : "#16a34a";
          if (zone.modeDefinition === "CERCLE" && zone.centreLatitude != null && zone.centreLongitude != null && zone.rayonMetres) {
            return (
              <Circle
                key={zone.idZoneGeographique}
                center={[zone.centreLatitude, zone.centreLongitude]}
                radius={zone.rayonMetres}
                pathOptions={{ color: couleur, fillColor: couleur, fillOpacity: 0.12, weight: 2 }}
              >
                <Popup>
                  <strong>{zone.nom}</strong> — {zone.type === "INTERDITE" ? "Zone interdite" : "Zone autorisée"}
                </Popup>
              </Circle>
            );
          }
          if (zone.modeDefinition === "POLYGONE" && zone.polygoneGeoJson) {
            try {
              const geometrie = JSON.parse(zone.polygoneGeoJson);
              return (
                <GeoJSON
                  key={zone.idZoneGeographique}
                  data={geometrie}
                  style={{ color: couleur, fillColor: couleur, fillOpacity: 0.12, weight: 2 }}
                >
                  <Popup>
                    <strong>{zone.nom}</strong> — {zone.type === "INTERDITE" ? "Zone interdite" : "Zone autorisée"}
                  </Popup>
                </GeoJSON>
              );
            } catch {
              return null; // Tracé GeoJSON illisible : ignoré silencieusement plutôt que de casser la carte.
            }
          }
          return null;
        })}
    </>
  );
}

/** Photo principale chargée à la demande (bouton), pas au montage — évite un appel par marqueur au chargement de la carte. */
function PhotoPrincipalePopup({ idEngin }: { idEngin: number }) {
  const [demandee, setDemandee] = useState(false);
  const { data: photos, isLoading } = useEnginPhotos(demandee ? idEngin : undefined);
  const principale = photos?.find((p) => p.estPrincipale) ?? photos?.[0];

  if (!demandee) {
    return (
      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => setDemandee(true)}>
        Voir la photo
      </Button>
    );
  }
  if (isLoading) {
    return (
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Chargement…
      </p>
    );
  }
  if (!principale) {
    return <p className="mt-2 text-xs text-muted-foreground">Aucune photo pour ce véhicule.</p>;
  }
  return (
    <AuthenticatedImage
      url={principale.url}
      alt={principale.nomFichierOriginal ?? "Photo de le véhicule"}
      className="mt-2 h-24 w-40 rounded"
    />
  );
}

function MarqueurFlotte({ position }: { position: PositionFlotte }) {
  return (
    <Marker position={[position.latitude, position.longitude]} icon={iconePourStatut(position.statutEngin)}>
      <Popup>
        <div className="min-w-[180px] space-y-1 text-sm">
          <p className="font-medium">{position.libelleVehicule}</p>
          <StatutBadge statut={position.statutEngin} />
          <p className="text-xs text-muted-foreground">Dispositif : {position.numeroSerie}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(position.horodatage)}</p>
          <p className="text-xs text-muted-foreground">Vitesse : {formatNombre(position.vitesse, 1)} km/h</p>
          <PhotoPrincipalePopup idEngin={position.idEngin} />
        </div>
      </Popup>
    </Marker>
  );
}

function LegendeCarte() {
  const entrees: [string, string][] = [
    ["Disponible", COULEUR_PAR_STATUT.DISPONIBLE],
    ["Affecté", COULEUR_PAR_STATUT.AFFECTE],
    ["En mission", COULEUR_PAR_STATUT.EN_MISSION],
    ["En panne", COULEUR_PAR_STATUT.EN_PANNE],
    ["En maintenance", COULEUR_PAR_STATUT.EN_MAINTENANCE],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {entrees.map(([libelle, couleur]) => (
        <span key={libelle} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: couleur }} />
          {libelle}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ borderColor: "#16a34a" }} />
        Zone autorisée
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ borderColor: "#dc2626" }} />
        Zone interdite
      </span>
    </div>
  );
}

export function FlotteMap() {
  const { data: flotte, isLoading: chargementFlotte } = usePositionsFlotte();
  const { data: dispositifs } = useDispositifsGps();
  const [idDispositifDetail, setIdDispositifDetail] = useState<string>("");
  const idSelectionne = idDispositifDetail ? Number(idDispositifDetail) : null;
  const { data: positionsDetail, isLoading: chargementDetail } = useDernieresPositions(idSelectionne);

  const modeDetail = idSelectionne !== null;

  // Le backend renvoie les positions du plus récent au plus ancien ; on
  // inverse pour tracer le trajet dans l'ordre chronologique.
  const trajetChronologique = useMemo(
    () => (positionsDetail ? [...positionsDetail].reverse() : []),
    [positionsDetail],
  );
  const pointsTrajet = useMemo<[number, number][]>(
    () => trajetChronologique.map((p) => [p.latitude, p.longitude]),
    [trajetChronologique],
  );
  const pointsFlotte = useMemo<[number, number][]>(
    () => (flotte ?? []).map((p) => [p.latitude, p.longitude]),
    [flotte],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xs flex-1 space-y-2">
          <Label>Voir le trajet détaillé d'un véhicule (optionnel)</Label>
          <Select value={idDispositifDetail} onValueChange={setIdDispositifDetail}>
            <SelectTrigger>
              <SelectValue placeholder="Vue flotte (tous les véhicules)" />
            </SelectTrigger>
            <SelectContent>
              {dispositifs?.map((d) => (
                <SelectItem key={d.idDispositifGps} value={String(d.idDispositifGps)}>
                  {d.numeroSerie} — {d.libelleVehicule ?? "non posé"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {modeDetail && (
          <Button variant="outline" onClick={() => setIdDispositifDetail("")}>
            Retour à la vue flotte
          </Button>
        )}
      </div>

      {(chargementFlotte || chargementDetail) && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la carte…
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <LegendeCarte />
          <div className="h-[520px] overflow-hidden rounded-md border">
            <MapContainer center={CENTRE_PAR_DEFAUT} zoom={ZOOM_PAR_DEFAUT} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CoucheZones />

              {!modeDetail && flotte?.map((position) => <MarqueurFlotte key={position.idDispositifGps} position={position} />)}

              {modeDetail && trajetChronologique.length > 0 && (
                <>
                  <Polyline positions={pointsTrajet} pathOptions={{ color: "#2563eb", weight: 3 }} />
                  {trajetChronologique.map((p, index) => (
                    <Marker
                      key={p.idPositionGps}
                      position={[p.latitude, p.longitude]}
                      icon={iconePourStatut(index === trajetChronologique.length - 1 ? "EN_MISSION" : "AFFECTE")}
                    >
                      <Popup>
                        <div className="space-y-1 text-sm">
                          <p className="text-xs text-muted-foreground">{formatDateTime(p.horodatage)}</p>
                          <p className="text-xs text-muted-foreground">Vitesse : {formatNombre(p.vitesse, 1)} km/h</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </>
              )}

              <AjusterVue points={modeDetail ? pointsTrajet : pointsFlotte} />
            </MapContainer>
          </div>
          {!modeDetail && !chargementFlotte && (flotte?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune position connue pour l'instant — les véhicules équipés d'un dispositif GPS actif apparaîtront ici
              dès réception d'une première position.
            </p>
          )}
          {modeDetail && !chargementDetail && trajetChronologique.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune position enregistrée pour ce dispositif.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
