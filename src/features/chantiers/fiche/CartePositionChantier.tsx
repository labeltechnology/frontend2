import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSON, LayersControl, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TileLayerAuthentifiee } from "@/features/cartographie/TileLayerAuthentifiee";
import { CoucheEtiquettesLieux } from "@/features/cartographie/CoucheEtiquettesLieux";
import {
  couleurParDefautType,
  iconePointZoneChantier,
  parserGeometrie,
  pointsDeGeometrie,
} from "@/features/chantiers/zone-chantier-rendu";
import { normaliserNombre } from "@/lib/utils";
import { arrondirPosition, type PositionCarte } from "@/features/chantiers/fiche/position";
import type { ZoneChantier } from "@/types/chantier";

// Centre par défaut (Antananarivo), mêmes valeurs que ChantiersMap/PlanChantierPage.
const CENTRE_PAR_DEFAUT: PositionCarte = [-18.8792, 47.5079];
const ZOOM_PAR_DEFAUT = 6;
const ZOOM_POSITION = 15;

/** Repère du chantier : même losange que ChantiersMap, en plus grand et en couleur primaire. */
const ICONE_CHANTIER = L.divIcon({
  className: "",
  html: '<span style="display:block;width:24px;height:24px;background:#2563eb;border:3px solid white;box-shadow:0 0 4px rgba(0,0,0,0.6);transform:rotate(45deg);border-radius:4px;"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function CaptureClic({ actif, onClic }: { actif: boolean; onClic: (p: PositionCarte) => void }) {
  useMapEvents({
    click(e) {
      if (actif) onClic(arrondirPosition([e.latlng.lat, e.latlng.lng]));
    },
  });
  return null;
}

/** Cadre la carte une seule fois, au premier affichage des données (position ou zones) — pas à chaque clic. */
function CadrageInitial({ points }: { points: PositionCarte[] }) {
  const map = useMap();
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current || points.length === 0) return;
    fait.current = true;
    if (points.length === 1) map.setView(points[0], ZOOM_POSITION);
    else map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
  }, [map, points]);
  return null;
}

/** Recentre quand la position est saisie à la main (coordonnées tapées). */
function SuivrePosition({ cible }: { cible: PositionCarte | null }) {
  const map = useMap();
  useEffect(() => {
    if (cible) map.setView(cible, Math.max(map.getZoom(), ZOOM_POSITION));
  }, [map, cible]);
  return null;
}

interface CartePositionChantierProps {
  position: PositionCarte | null;
  onChange: (position: PositionCarte | null) => void;
  /** Éléments déjà tracés sur le plan du chantier (correction) — affichés en lecture seule, pour se repérer. */
  zones?: ZoneChantier[];
  lectureSeule?: boolean;
}

/**
 * Carte de position de la fiche chantier (2026-09-24) : un clic place le
 * repère, on le fait glisser pour l'ajuster ; les coordonnées peuvent aussi
 * être saisies (relevé GPS d'un téléphone). Fonds Plan / Satellite et
 * couche « noms de lieux » identiques à la carte d'ensemble (ChantiersMap).
 */
export function CartePositionChantier({ position, onChange, zones = [], lectureSeule = false }: CartePositionChantierProps) {
  const [latSaisie, setLatSaisie] = useState("");
  const [lngSaisie, setLngSaisie] = useState("");
  const [erreurSaisie, setErreurSaisie] = useState<string | null>(null);
  const [cibleSaisie, setCibleSaisie] = useState<PositionCarte | null>(null);

  // Position d'ouverture de la fiche : sert au cadrage initial seulement (pas de recadrage à chaque clic).
  const [positionInitiale] = useState(position);
  const pointsInitiaux = useMemo<PositionCarte[]>(
    () => [...(positionInitiale ? [positionInitiale] : []), ...zones.flatMap((z) => pointsDeGeometrie(z.geometrieGeoJson))],
    [positionInitiale, zones],
  );

  const placerDepuisSaisie = () => {
    const lat = Number(normaliserNombre(latSaisie));
    const lng = Number(normaliserNombre(lngSaisie));
    if (!latSaisie.trim() || !lngSaisie.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErreurSaisie("Saisissez une latitude et une longitude (ex. -18.8792 et 47.5079).");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErreurSaisie("Latitude entre -90 et 90, longitude entre -180 et 180.");
      return;
    }
    setErreurSaisie(null);
    const nouvelle = arrondirPosition([lat, lng]);
    setCibleSaisie(nouvelle);
    onChange(nouvelle);
  };

  return (
    <div className="space-y-3">
      <div className="relative h-[380px] overflow-hidden rounded-lg border border-border">
        <MapContainer center={position ?? CENTRE_PAR_DEFAUT} zoom={position ? ZOOM_POSITION : ZOOM_PAR_DEFAUT} className="h-full w-full">
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
            <LayersControl.Overlay checked name="Noms de lieux (villes, villages)">
              <CoucheEtiquettesLieux />
            </LayersControl.Overlay>
          </LayersControl>

          {zones.map((zone) => {
            const geometrie = parserGeometrie(zone.geometrieGeoJson);
            if (!geometrie) return null;
            if (geometrie.type === "Point") {
              const [point] = pointsDeGeometrie(zone.geometrieGeoJson);
              return point ? (
                <Marker key={zone.idZoneChantier} position={point} icon={iconePointZoneChantier(zone.type, zone.couleur ?? undefined)} interactive={false} />
              ) : null;
            }
            const couleur = zone.couleur ?? couleurParDefautType(zone.type);
            return (
              <GeoJSON
                key={zone.idZoneChantier}
                data={geometrie}
                interactive={false}
                style={geometrie.type === "LineString" ? { color: couleur, weight: 4, opacity: 0.7 } : { color: couleur, fillOpacity: 0.12, weight: 2 }}
              />
            );
          })}

          {position && (
            <Marker
              position={position}
              icon={ICONE_CHANTIER}
              draggable={!lectureSeule}
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  onChange(arrondirPosition([lat, lng]));
                },
              }}
            />
          )}

          <CaptureClic actif={!lectureSeule} onClic={onChange} />
          <CadrageInitial points={pointsInitiaux} />
          <SuivrePosition cible={cibleSaisie} />
        </MapContainer>
        {!position && !lectureSeule && (
          <p className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-xs shadow">
            Cliquez sur la carte pour placer le chantier
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {position ? (
          <span>
            Position : <span className="font-medium tabular-nums">{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
            {!lectureSeule && <span className="text-muted-foreground"> — faites glisser le repère pour l'ajuster</span>}
          </span>
        ) : (
          <span className="text-muted-foreground">Chantier non placé sur la carte.</span>
        )}
        {position && !lectureSeule && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
            Retirer le repère
          </Button>
        )}
      </div>

      {!lectureSeule && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Saisir des coordonnées</summary>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <Input
              aria-label="Latitude"
              onKeyDown={(e) => {
                // Entrée place le repère au lieu d'envoyer toute la fiche (champ situé dans le formulaire de la page).
                if (e.key === "Enter") {
                  e.preventDefault();
                  placerDepuisSaisie();
                }
              }}
              placeholder="Latitude (ex. -18.8792)"
              value={latSaisie}
              onChange={(e) => setLatSaisie(e.target.value)}
              className="h-9 w-44"
              inputMode="decimal"
            />
            <Input
              aria-label="Longitude"
              onKeyDown={(e) => {
                // Entrée place le repère au lieu d'envoyer toute la fiche (champ situé dans le formulaire de la page).
                if (e.key === "Enter") {
                  e.preventDefault();
                  placerDepuisSaisie();
                }
              }}
              placeholder="Longitude (ex. 47.5079)"
              value={lngSaisie}
              onChange={(e) => setLngSaisie(e.target.value)}
              className="h-9 w-44"
              inputMode="decimal"
            />
            <Button type="button" variant="secondary" size="sm" onClick={placerDepuisSaisie}>
              Placer
            </Button>
          </div>
          {erreurSaisie && <p className="mt-1 text-xs text-destructive">{erreurSaisie}</p>}
        </details>
      )}
    </div>
  );
}
