import { Fragment, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSON, LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Loader2 } from "lucide-react";
import { TileLayerAuthentifiee } from "@/features/cartographie/TileLayerAuthentifiee";
import { CoucheEtiquettesLieux } from "@/features/cartographie/CoucheEtiquettesLieux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { useEnginPhotos } from "@/features/engins/photos-api";
import { usePositionsFlotte } from "@/features/gps/api";
import { useAffectationsChantier, useChantiers, useZonesTousChantiers } from "@/features/chantiers/api";
import { LIBELLE_STATUT, VARIANT_STATUT } from "@/features/chantiers/ChantiersPage";
import {
  TYPE_ZONE_LIBELLE,
  couleurParDefautType,
  iconePointZoneChantier,
  parserGeometrie,
  pointsDeGeometrie,
} from "@/features/chantiers/zone-chantier-rendu";
import { formatDate, formatDateTime, formatNombre } from "@/lib/utils";
import type { Chantier, ZoneChantier } from "@/types/chantier";
import type { PositionFlotte } from "@/types/gps";

// Centre par défaut (Antananarivo), même valeurs que FlotteMap.tsx/ZonesChantierDialog.tsx —
// la carte se recentre automatiquement dès que des zones existent (voir AjusterVue).
const CENTRE_PAR_DEFAUT: [number, number] = [-18.8792, 47.5079];
const ZOOM_PAR_DEFAUT = 6;

const COULEUR_PAR_STATUT_CHANTIER: Record<Chantier["statut"], string> = {
  PLANIFIE: "#64748b",
  EN_COURS: "#d97706",
  TERMINE: "#16a34a",
  ANNULE: "#dc2626",
};

const COULEUR_PAR_STATUT_ENGIN: Record<string, string> = {
  DISPONIBLE: "#16a34a",
  AFFECTE: "#64748b",
  EN_MISSION: "#2563eb",
  EN_PANNE: "#dc2626",
  EN_MAINTENANCE: "#d97706",
};
const COULEUR_ENGIN_DEFAUT = "#6b7280";

/** Marqueur "chantier" : losange coloré par statut, pour se distinguer visuellement des marqueurs d'engins (ronds). */
function iconeChantier(statut: Chantier["statut"]): L.DivIcon {
  const couleur = COULEUR_PAR_STATUT_CHANTIER[statut];
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;background:${couleur};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.6);transform:rotate(45deg);border-radius:3px;"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function iconeEngin(statutEngin: string): L.DivIcon {
  const couleur = COULEUR_PAR_STATUT_ENGIN[statutEngin] ?? COULEUR_ENGIN_DEFAUT;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${couleur};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.6);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

/** Recentre/ajuste le zoom sur un ensemble de points dès qu'il change — même principe que FlotteMap.AjusterVue. */
function AjusterVue({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    }
  }, [map, points]);
  return null;
}

/** Extrait tous les sommets [lat, lng] des zones d'un chantier, quel que soit leur type de géométrie (point/ligne/polygone). */
function pointsDesZones(zones: ZoneChantier[]): [number, number][] {
  return zones.flatMap((zone) => pointsDeGeometrie(zone.geometrieGeoJson));
}

/**
 * Centre d'un chantier : sa position placée sur la fiche chantier
 * (2026-09-24) si elle existe, sinon le barycentre de tous les sommets de
 * ses zones (chantiers créés avant la fiche).
 */
function centreChantier(chantier: Chantier, zones: ZoneChantier[]): [number, number] | null {
  if (chantier.latitude != null && chantier.longitude != null) return [chantier.latitude, chantier.longitude];
  const points = pointsDesZones(zones);
  if (points.length === 0) return null;
  const [sommeLat, sommeLng] = points.reduce(([lat, lng], [lat2, lng2]) => [lat + lat2, lng + lng2], [0, 0]);
  return [sommeLat / points.length, sommeLng / points.length];
}

/** Photo principale chargée à la demande — même patron que FlotteMap.PhotoPrincipalePopup. */
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
      alt={principale.nomFichierOriginal ?? "Photo du véhicule"}
      className="mt-2 h-24 w-40 rounded"
    />
  );
}

function MarqueurEnginChantier({ position }: { position: PositionFlotte }) {
  return (
    <Marker position={[position.latitude, position.longitude]} icon={iconeEngin(position.statutEngin)}>
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

interface ChantierAvecCentre {
  chantier: Chantier;
  zones: ZoneChantier[];
  centre: [number, number];
}

function LegendeCarte() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span
          className="inline-block h-2.5 w-2.5 rotate-45 rounded-sm"
          style={{ background: COULEUR_PAR_STATUT_CHANTIER.EN_COURS }}
        />
        Chantier (losange, couleur = statut)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COULEUR_PAR_STATUT_ENGIN.DISPONIBLE }} />
        Engin (rond, couleur = statut), affiché en cliquant sur un chantier
      </span>
    </div>
  );
}

/**
 * Carte de tous les chantiers avec leurs éléments de plan (tracés sur
 * OpenStreetMap — voir PlanChantierPage). Cliquer sur un chantier zoome dessus et affiche
 * les engins qui y sont rattachés (« Engins rattachés ») disposant d'un GPS
 * actif, avec une infobulle contenant leur photo — même patron que la carte
 * flotte du module GPS (FlotteMap.tsx), mais filtrée à un seul chantier.
 */
export function ChantiersMap() {
  const { data: chantiers, isLoading: chargementChantiers } = useChantiers();
  const resultatsZones = useZonesTousChantiers(chantiers);
  const { data: flotte } = usePositionsFlotte();

  const [idChantierSelectionne, setIdChantierSelectionne] = useState<number | null>(null);

  const chargementZones = resultatsZones.some((r) => r.isLoading);

  const chantiersAvecCentre = useMemo<ChantierAvecCentre[]>(() => {
    return (chantiers ?? []).flatMap((chantier, index) => {
      const zones = resultatsZones[index]?.data ?? [];
      const centre = centreChantier(chantier, zones);
      return centre ? [{ chantier, zones, centre }] : [];
    });
  }, [chantiers, resultatsZones]);

  const chantiersSansZone = useMemo(() => {
    const idsAvecCentre = new Set(chantiersAvecCentre.map((c) => c.chantier.idChantier));
    return (chantiers ?? []).filter((c) => !idsAvecCentre.has(c.idChantier));
  }, [chantiers, chantiersAvecCentre]);

  const chantierSelectionne = chantiersAvecCentre.find((c) => c.chantier.idChantier === idChantierSelectionne) ?? null;
  const modeSelection = chantierSelectionne !== null;

  const { data: affectations } = useAffectationsChantier(idChantierSelectionne ?? undefined);

  const idsEnginsRattaches = useMemo(
    () => new Set((affectations ?? []).filter((a) => a.statut === "ACTIVE").map((a) => a.engin.idEngin)),
    [affectations],
  );

  const positionsEnginsChantier = useMemo(
    () => (flotte ?? []).filter((p) => idsEnginsRattaches.has(p.idEngin)),
    [flotte, idsEnginsRattaches],
  );

  const chantiersAffiches = modeSelection
    ? chantiersAvecCentre.filter((c) => c.chantier.idChantier === idChantierSelectionne)
    : chantiersAvecCentre;

  const pointsVue = useMemo<[number, number][]>(() => {
    if (modeSelection && chantierSelectionne) {
      return [
        chantierSelectionne.centre,
        ...pointsDesZones(chantierSelectionne.zones),
        ...positionsEnginsChantier.map((p): [number, number] => [p.latitude, p.longitude]),
      ];
    }
    return chantiersAvecCentre.flatMap((c) => [c.centre, ...pointsDesZones(c.zones)]);
  }, [modeSelection, chantierSelectionne, positionsEnginsChantier, chantiersAvecCentre]);

  const chargement = chargementChantiers || chargementZones;

  return (
    <div className="space-y-4">
      {modeSelection && chantierSelectionne && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{chantierSelectionne.chantier.nom}</p>
              <Badge variant={VARIANT_STATUT[chantierSelectionne.chantier.statut]}>
                {LIBELLE_STATUT[chantierSelectionne.chantier.statut]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {positionsEnginsChantier.length} engin{positionsEnginsChantier.length > 1 ? "s" : ""} avec GPS actif rattaché
              {positionsEnginsChantier.length > 1 ? "s" : ""} à ce chantier
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIdChantierSelectionne(null)}>
            Retour à la vue d'ensemble
          </Button>
        </div>
      )}

      {chargement && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la carte…
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <LegendeCarte />
          <div className="h-[560px] overflow-hidden rounded-md border">
            <MapContainer center={CENTRE_PAR_DEFAUT} zoom={ZOOM_PAR_DEFAUT} className="h-full w-full">
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Plan">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  {/* Tuiles Mapbox Satellite, relayées par notre backend (voir
                      TuileSatelliteController) — jeton jamais exposé au
                      navigateur. Nécessite d'avoir configuré et activé
                      l'intégration dans Paramètres > Vue satellite ; sinon les
                      tuiles restent vides (503 côté proxy). */}
                  <TileLayerAuthentifiee
                    urlModele="/api/cartographie/tuiles-satellite/{z}/{x}/{y}.png"
                    attribution='Imagerie satellite &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                  />
                </LayersControl.BaseLayer>
                {/* Couche superposable indépendamment (noms de ville/village, frontières) — voir
                    CoucheEtiquettesLieux et CLAUDE.md, section « Cartographie (vue satellite) ».
                    Cochée par défaut : utile aussi bien sur le fond Plan (redondant avec OSM mais
                    inoffensif) que sur le fond Satellite (où elle apporte les noms absents des
                    tuiles brutes). Décochable indépendamment du fond choisi. */}
                <LayersControl.Overlay checked name="Noms de lieux (villes, villages)">
                  <CoucheEtiquettesLieux />
                </LayersControl.Overlay>
              </LayersControl>

              {chantiersAffiches.map(({ chantier, zones, centre }) => (
                <Fragment key={chantier.idChantier}>
                  {zones.map((zone) => {
                    const geometrie = parserGeometrie(zone.geometrieGeoJson);
                    if (!geometrie) return null; // tracé illisible : ignoré plutôt que de casser la carte

                    if (geometrie.type === "Point") {
                      const [position] = pointsDeGeometrie(zone.geometrieGeoJson);
                      if (!position) return null;
                      return (
                        <Marker
                          key={zone.idZoneChantier}
                          position={position}
                          icon={iconePointZoneChantier(zone.type, zone.couleur ?? undefined)}
                        >
                          <Popup>
                            {zone.nom} — {TYPE_ZONE_LIBELLE[zone.type]}
                          </Popup>
                        </Marker>
                      );
                    }

                    const couleur = zone.couleur ?? couleurParDefautType(zone.type) ?? COULEUR_PAR_STATUT_CHANTIER[chantier.statut];
                    const style =
                      geometrie.type === "LineString"
                        ? { color: couleur, weight: 5, opacity: 0.85 } // route : trait plein, pas de remplissage
                        : { color: couleur, fillColor: couleur, fillOpacity: 0.18, weight: 2 };
                    return (
                      <GeoJSON key={zone.idZoneChantier} data={geometrie} style={style}>
                        <Popup>
                          {zone.nom} — {TYPE_ZONE_LIBELLE[zone.type]}
                        </Popup>
                      </GeoJSON>
                    );
                  })}
                  <Marker
                    position={centre}
                    icon={iconeChantier(chantier.statut)}
                    eventHandlers={{ click: () => setIdChantierSelectionne(chantier.idChantier) }}
                  >
                    <Popup>
                      <div className="min-w-[180px] space-y-1 text-sm">
                        <p className="font-medium">{chantier.nom}</p>
                        <Badge variant={VARIANT_STATUT[chantier.statut]}>{LIBELLE_STATUT[chantier.statut]}</Badge>
                        {chantier.lieu && <p className="text-xs text-muted-foreground">{chantier.lieu}</p>}
                        <p className="text-xs text-muted-foreground">
                          Du {formatDate(chantier.dateDebutPrevue)} au {formatDate(chantier.dateFinPrevue)}
                        </p>
                        {!modeSelection && (
                          <p className="text-xs text-muted-foreground">Cliquer sur le marqueur pour voir les véhicules.</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </Fragment>
              ))}

              {modeSelection && positionsEnginsChantier.map((position) => (
                <MarqueurEnginChantier key={position.idDispositifGps} position={position} />
              ))}

              <AjusterVue points={pointsVue} />
            </MapContainer>
          </div>

          {!chargement && chantiersAvecCentre.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun chantier n'est encore placé — placez-le sur sa fiche (action « Voir / modifier la fiche ») ou
              tracez un élément de son plan pour qu'il apparaisse sur cette carte.
            </p>
          )}
          {modeSelection && !chargement && positionsEnginsChantier.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun engin avec GPS actif n'est actuellement rattaché à ce chantier.
            </p>
          )}
          {!modeSelection && chantiersSansZone.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Chantiers sans position ni zone tracée, non affichés sur la carte : {chantiersSansZone.map((c) => c.nom).join(", ")}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
