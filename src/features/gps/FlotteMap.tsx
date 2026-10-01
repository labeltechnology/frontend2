import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatutBadge } from "@/components/data-table/StatutBadge";
import { AuthenticatedImage } from "@/features/engins/AuthenticatedImage";
import { useEnginPhotos } from "@/features/engins/photos-api";
import { useDispositifsGps, usePositionsFlotte } from "@/features/gps/api";
import { useChantiersCarte } from "@/features/gps/chantiers/api";
import {
  COULEUR_STATUT_CHANTIER,
  COULEUR_TON,
  LIBELLE_STATUT_CHANTIER,
  centreChantier,
  pointsChantier,
  situationsDuVehicule,
  type SituationVehicule,
} from "@/features/gps/chantiers/carte-chantiers";
import { CoucheChantiers } from "@/features/gps/chantiers/CoucheChantiers";
import { COUCHES_PAR_DEFAUT, ControlesCarte, type CouchesCarte } from "@/features/gps/chantiers/ControlesCarte";
import { COULEUR_PAR_STATUT, iconePourStatut } from "@/features/gps/icone-statut";
import { useTrajetPeriode } from "@/features/gps/trajet/api";
import { CoucheTrajet } from "@/features/gps/trajet/CoucheTrajet";
import { bornesPeriode, estErreur, jourLocal, type ChoixPeriode } from "@/features/gps/trajet/periode";
import { ResumeTrajet } from "@/features/gps/trajet/ResumeTrajet";
import { SelecteurPeriode } from "@/features/gps/trajet/SelecteurPeriode";
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
      alt={principale.nomFichierOriginal ?? "Photo du véhicule"}
      className="mt-2 h-24 w-40 rounded"
    />
  );
}

function MarqueurFlotte({ position, situations }: { position: PositionFlotte; situations: SituationVehicule[] }) {
  return (
    <Marker position={[position.latitude, position.longitude]} icon={iconePourStatut(position.statutEngin)}>
      <Popup>
        <div className="min-w-[180px] space-y-1 text-sm">
          <p className="font-medium">{position.libelleVehicule}</p>
          <StatutBadge statut={position.statutEngin} />
          <p className="text-xs text-muted-foreground">Dispositif : {position.numeroSerie}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(position.horodatage)}</p>
          <p className="text-xs text-muted-foreground">Vitesse : {formatNombre(position.vitesse, 1)} km/h</p>
          {situations.map((s) => (
            <p key={s.idChantier} className="flex items-start gap-1.5 text-xs">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: COULEUR_TON[s.ton] }} />
              {s.texte}
            </p>
          ))}
          <PhotoPrincipalePopup idEngin={position.idEngin} />
        </div>
      </Popup>
    </Marker>
  );
}

function LegendeCarte({ chantiers }: { chantiers: boolean }) {
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
      {chantiers &&
        (["EN_COURS", "PLANIFIE"] as const).map((statut) => (
          <span key={statut} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COULEUR_STATUT_CHANTIER[statut] }} />
            Chantier {LIBELLE_STATUT_CHANTIER[statut].toLowerCase()}
          </span>
        ))}
    </div>
  );
}

/**
 * Carte GPS : vue flotte (dernière position de chaque véhicule) ou trajet
 * d'un véhicule sur une période. Depuis le 2026-09-30, les chantiers
 * planifiés et en cours y figurent (repère, périmètre de présence, plan), la
 * bulle d'un véhicule dit s'il est sur son chantier, et le trajet liste ses
 * passages sur chantier (entrée, sortie, durée).
 */
export function FlotteMap() {
  const { data: flotte, isLoading: chargementFlotte } = usePositionsFlotte();
  const { data: dispositifs } = useDispositifsGps();
  const [couches, setCouches] = useState<CouchesCarte>(COUCHES_PAR_DEFAUT);
  const { data: chantiers } = useChantiersCarte(couches.chantiers);
  const [idChantierCentre, setIdChantierCentre] = useState("tous");
  const [idDispositifDetail, setIdDispositifDetail] = useState<string>("");
  const [choixPeriode, setChoixPeriode] = useState<ChoixPeriode>("AUJOURDHUI");
  const [perso, setPerso] = useState(() => ({ debut: jourLocal(new Date()), fin: jourLocal(new Date()) }));
  const idSelectionne = idDispositifDetail ? Number(idDispositifDetail) : null;

  const bornes = useMemo(() => bornesPeriode(choixPeriode, new Date(), perso), [choixPeriode, perso]);
  const erreurPeriode = estErreur(bornes) ? bornes.erreur : null;
  const enDirect = choixPeriode === "AUJOURDHUI" || choixPeriode === "SEPT_JOURS" || (choixPeriode === "PERSO" && perso.fin >= jourLocal(new Date()));
  const { data: trajet, isLoading: chargementDetail, isError: erreurTrajet } = useTrajetPeriode(
    idSelectionne,
    estErreur(bornes) ? null : bornes,
    enDirect,
  );

  const modeDetail = idSelectionne !== null;
  const chantiersAffiches = useMemo(() => (couches.chantiers ? (chantiers ?? []) : []), [couches.chantiers, chantiers]);
  const chantierCentre = chantiersAffiches.find((c) => String(c.idChantier) === idChantierCentre);

  const pointsTrajet = useMemo<[number, number][]>(
    () => (trajet?.positions ?? []).map((p) => [p.latitude, p.longitude]),
    [trajet],
  );
  const pointsFlotte = useMemo<[number, number][]>(() => {
    const vehicules = (flotte ?? []).map((p) => [p.latitude, p.longitude] as [number, number]);
    const reperes = chantiersAffiches.map(centreChantier).filter((p): p is [number, number] => p !== null);
    return [...vehicules, ...reperes];
  }, [flotte, chantiersAffiches]);
  const pointsCentre = useMemo(() => (chantierCentre ? pointsChantier(chantierCentre) : null), [chantierCentre]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-72 space-y-2">
            <Label>Voir le trajet d'un véhicule (facultatif)</Label>
            <Select value={idDispositifDetail} onValueChange={setIdDispositifDetail}>
              <SelectTrigger>
                <SelectValue placeholder="Vue d'ensemble de la flotte (tous les véhicules)" />
              </SelectTrigger>
              <SelectContent>
                {dispositifs?.map((d) => (
                  <SelectItem key={d.idDispositifGps} value={String(d.idDispositifGps)}>
                    {d.numeroSerie} — {d.libelleVehicule ?? "non installé"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modeDetail && (
            <SelecteurPeriode choix={choixPeriode} onChoix={setChoixPeriode} perso={perso} onPerso={setPerso} erreur={erreurPeriode} />
          )}
        </div>
        {modeDetail && (
          <Button variant="outline" onClick={() => setIdDispositifDetail("")}>
            Retour à la vue flotte
          </Button>
        )}
      </div>

      {(chargementFlotte || (modeDetail && chargementDetail)) && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la carte…
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <ControlesCarte
            couches={couches}
            onCouches={setCouches}
            chantiers={chantiers}
            idChantierCentre={idChantierCentre}
            onCentrer={setIdChantierCentre}
          />
          <LegendeCarte chantiers={couches.chantiers} />
          <div className="h-[520px] overflow-hidden rounded-md border">
            <MapContainer center={CENTRE_PAR_DEFAUT} zoom={ZOOM_PAR_DEFAUT} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CoucheZones />
              <CoucheChantiers chantiers={chantiersAffiches} afficherPerimetre={couches.perimetres} afficherPlan={couches.plans} />

              {!modeDetail &&
                flotte?.map((position) => (
                  <MarqueurFlotte
                    key={position.idDispositifGps}
                    position={position}
                    situations={situationsDuVehicule(position.idEngin, chantiersAffiches)}
                  />
                ))}

              {modeDetail && trajet && <CoucheTrajet trajet={trajet} />}

              <AjusterVue points={pointsCentre ?? (modeDetail ? pointsTrajet : pointsFlotte)} />
            </MapContainer>
          </div>
          {!modeDetail && !chargementFlotte && (flotte?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucune position connue pour l'instant — les véhicules équipés d'un dispositif GPS actif apparaîtront ici
              dès réception d'une première position.
            </p>
          )}
          {modeDetail && erreurTrajet && <p className="text-sm text-destructive">Trajet illisible pour cette période.</p>}
          {modeDetail && trajet && trajet.positions.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune position enregistrée pour ce véhicule sur cette période.</p>
          )}
          {modeDetail && trajet && trajet.positions.length > 0 && <ResumeTrajet trajet={trajet} />}
        </CardContent>
      </Card>
    </div>
  );
}
