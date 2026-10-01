import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoJSON, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { ArrowLeft, Loader2, Map as IconPlan, Satellite, Tags, Trash2 } from "lucide-react";
import { TileLayerAuthentifiee } from "@/features/cartographie/TileLayerAuthentifiee";
import { CoucheEtiquettesLieux } from "@/features/cartographie/CoucheEtiquettesLieux";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/data-table/PageHeader";
import {
  useChantiers,
  useCreerZoneChantier,
  useModifierZoneChantier,
  useSupprimerZoneChantier,
  useZonesChantier,
} from "@/features/chantiers/api";
import {
  TYPE_ZONE_LIBELLE,
  couleurParDefautType,
  iconePointZoneChantier,
  parserGeometrie,
  pointsDeGeometrie,
  versLigneGeoJson,
  versPointGeoJson,
  versPolygoneGeoJson,
} from "@/features/chantiers/zone-chantier-rendu";
import { ApiError } from "@/lib/api-client";
import type { TypeZoneChantier, ZoneChantier } from "@/types/chantier";
import { toast } from "sonner";

// Centre par défaut (Antananarivo), mêmes valeurs que les autres cartes du
// module (FlotteMap.tsx, ChantiersMap.tsx) — la carte se recentre
// automatiquement dès qu'un élément existe (voir AjusterVue).
const CENTRE_PAR_DEFAUT: [number, number] = [-18.8792, 47.5079];
const ZOOM_PAR_DEFAUT = 6;

const COULEURS = ["#f59e0b", "#ef4444", "#3b82f6", "#374151", "#22c55e", "#a855f7", "#06b6d4"];

type FormeOutil = "POINT" | "LIGNE" | "POLYGONE";

interface OutilDef {
  id: string;
  libelle: string;
  type: TypeZoneChantier;
  minPoints: number;
  forme: FormeOutil;
}

/**
 * La boîte à outils du plan de chantier (demande du chef d'entreprise du
 * 2026-09-22) : chaque outil fixe à la fois le type de la zone créée et la
 * géométrie attendue — c'est lui qui garantit la cohérence type/géométrie,
 * pas une contrainte serveur stricte (voir TypeZoneChantier côté backend).
 * "Local technique" a deux entrées (rectangle ou icône) : au choix de
 * l'utilisateur, décision explicite du 2026-09-22. Pas d'outil "zone libre"
 * (AUTRE) : la boîte à outils ne propose que les éléments demandés — les
 * zones AUTRE existantes (créées avant cette notion) restent visibles et
 * supprimables, mais plus créables depuis cette page.
 */
const OUTILS: OutilDef[] = [
  { id: "LOCAL_TECHNIQUE_RECTANGLE", libelle: "Local technique (rectangle)", type: "LOCAL_TECHNIQUE", minPoints: 3, forme: "POLYGONE" },
  { id: "LOCAL_TECHNIQUE_ICONE", libelle: "Local technique (icône)", type: "LOCAL_TECHNIQUE", minPoints: 1, forme: "POINT" },
  { id: "LOCAL_MEDICAL", libelle: "Local médical", type: "LOCAL_MEDICAL", minPoints: 1, forme: "POINT" },
  { id: "STOCKAGE", libelle: "Stockage", type: "STOCKAGE", minPoints: 1, forme: "POINT" },
  { id: "ROUTE", libelle: "Route (construction routière)", type: "ROUTE", minPoints: 2, forme: "LIGNE" },
];

function geometrieDepuisPoints(outil: OutilDef, points: [number, number][]): string {
  if (outil.forme === "POINT") return versPointGeoJson(points[0]);
  if (outil.forme === "LIGNE") return versLigneGeoJson(points);
  return versPolygoneGeoJson(points);
}

/** Recentre/ajuste le zoom sur les éléments existants — même principe que FlotteMap.AjusterVue. */
function AjusterVue({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 16);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32] });
    }
  }, [map, points]);
  return null;
}

/** Capture les clics sur la carte pendant qu'un outil est actif. */
function CaptureClics({ actif, onClic }: { actif: boolean; onClic: (point: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (actif) onClic([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function ZoneExistante({ zone }: { zone: ZoneChantier }) {
  const geometrie = parserGeometrie(zone.geometrieGeoJson);
  if (!geometrie) return null; // tracé illisible : ignoré plutôt que de casser la carte

  if (geometrie.type === "Point") {
    const [position] = pointsDeGeometrie(zone.geometrieGeoJson);
    if (!position) return null;
    return (
      <Marker position={position} icon={iconePointZoneChantier(zone.type, zone.couleur ?? undefined)}>
        <Popup>
          {zone.nom} — {TYPE_ZONE_LIBELLE[zone.type]}
        </Popup>
      </Marker>
    );
  }

  const couleur = zone.couleur ?? couleurParDefautType(zone.type);
  const style =
    geometrie.type === "LineString"
      ? { color: couleur, weight: 5, opacity: 0.85 } // route : trait plein plus épais, pas de remplissage
      : { color: couleur, fillColor: couleur, fillOpacity: 0.2, weight: 2 };
  return (
    <GeoJSON data={geometrie} style={style}>
      <Popup>
        {zone.nom} — {TYPE_ZONE_LIBELLE[zone.type]}
      </Popup>
    </GeoJSON>
  );
}

/**
 * Plan du chantier : carte interactive avec boîte à outils pour placer les
 * éléments du terrain (local technique, local médical, stockage) et, pour
 * un chantier de construction routière, tracer la route — demande du chef
 * d'entreprise du 2026-09-22. Remplace l'ancienne ZonesChantierDialog (un
 * seul outil "polygone libre") : page dédiée plutôt que boîte de dialogue,
 * plus de place pour la carte et la boîte à outils.
 */
export function PlanChantierPage() {
  const { idChantier: idChantierParam } = useParams<{ idChantier: string }>();
  const idChantier = idChantierParam ? Number(idChantierParam) : undefined;
  const navigate = useNavigate();

  const { data: chantiers } = useChantiers();
  const chantier = chantiers?.find((c) => c.idChantier === idChantier);

  const { data: zones } = useZonesChantier(idChantier);
  const creerZone = useCreerZoneChantier();
  const modifierZone = useModifierZoneChantier(idChantier ?? 0);
  const supprimerZone = useSupprimerZoneChantier(idChantier ?? 0);

  // Bascule Plan (OpenStreetMap) / Satellite — demande du 2026-09-22 : un
  // bouton explicite dans l'en-tête plutôt que le petit sélecteur de couches
  // Leaflet, moins visible.
  const [vueSatellite, setVueSatellite] = useState(false);

  // Couche noms de lieux (villes, villages) superposée à la vue satellite —
  // séparée et masquable indépendamment de l'imagerie (voir
  // CoucheEtiquettesLieux et CLAUDE.md, section « Cartographie (vue
  // satellite) »). Sans objet en vue Plan (OSM affiche déjà les noms) : le
  // bouton n'apparaît que quand vueSatellite est actif.
  const [afficherEtiquettes, setAfficherEtiquettes] = useState(true);

  const [outilActifId, setOutilActifId] = useState<string | null>(null);
  const outilActif = OUTILS.find((o) => o.id === outilActifId) ?? null;
  const [pointsTemp, setPointsTemp] = useState<[number, number][]>([]);
  const [nomZone, setNomZone] = useState("");
  const [couleurZone, setCouleurZone] = useState(COULEURS[0]);

  const onChoisirOutil = (outil: OutilDef) => {
    if (outilActifId === outil.id) {
      setOutilActifId(null);
      setPointsTemp([]);
      return;
    }
    setOutilActifId(outil.id);
    setPointsTemp([]);
    setNomZone("");
    setCouleurZone(couleurParDefautType(outil.type));
  };

  const onAnnulerDessin = () => {
    setOutilActifId(null);
    setPointsTemp([]);
    setNomZone("");
  };

  const onClicCarte = (point: [number, number]) => {
    if (!outilActif) return;
    // Un point (icône) n'a qu'une seule coordonnée : un nouveau clic repositionne
    // plutôt que d'accumuler — contrairement à une ligne/un polygone où chaque
    // clic ajoute un sommet.
    setPointsTemp((pts) => (outilActif.forme === "POINT" ? [point] : [...pts, point]));
  };

  // Tous les sommets des éléments existants, pour cadrer la carte dessus au premier affichage.
  const tousLesPoints = useMemo(
    () => (zones ?? []).flatMap((zone) => pointsDeGeometrie(zone.geometrieGeoJson)),
    [zones],
  );

  const onValiderZone = async () => {
    if (!idChantier || !outilActif || pointsTemp.length < outilActif.minPoints || !nomZone.trim()) return;
    try {
      await creerZone.mutateAsync({
        idChantier,
        nom: nomZone.trim(),
        type: outilActif.type,
        couleur: couleurZone,
        geometrieGeoJson: geometrieDepuisPoints(outilActif, pointsTemp),
      });
      toast.success("Élément ajouté au plan");
      onAnnulerDessin();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Impossible d'enregistrer l'élément");
    }
  };

  const onRenommerZone = async (zone: ZoneChantier) => {
    const nouveauNom = window.prompt("Nouveau nom :", zone.nom);
    if (!nouveauNom || !nouveauNom.trim()) return;
    try {
      await modifierZone.mutateAsync({
        id: zone.idZoneChantier,
        requete: {
          nom: nouveauNom.trim(),
          type: zone.type,
          couleur: zone.couleur ?? undefined,
          geometrieGeoJson: zone.geometrieGeoJson,
        },
      });
      toast.success("Élément renommé");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action impossible");
    }
  };

  const onSupprimerZone = async (idZoneChantier: number) => {
    try {
      await supprimerZone.mutateAsync(idZoneChantier);
      toast.success("Élément supprimé");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  };

  if (idChantier === undefined) {
    return null; // route mal formée (idChantier absent/non numérique) : rien à afficher
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Plan du chantier${chantier ? ` — ${chantier.nom}` : ""}`}
        description="Placez les éléments du terrain directement sur la carte (local technique, local médical, stockage) et, pour un chantier de construction routière, tracez la route."
        actions={
          <div className="flex items-center gap-2">
            {vueSatellite && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setAfficherEtiquettes((v) => !v)}
                title={afficherEtiquettes ? "Masquer les noms de lieux" : "Afficher les noms de lieux"}
              >
                <Tags className="h-4 w-4" />
                {afficherEtiquettes ? "Masquer les noms" : "Afficher les noms"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setVueSatellite((v) => !v)}>
              {vueSatellite ? <IconPlan className="h-4 w-4" /> : <Satellite className="h-4 w-4" />}
              {vueSatellite ? "Vue plan" : "Vue satellite"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/chantiers")}>
              <ArrowLeft className="h-4 w-4" />
              Retour aux chantiers
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap gap-2">
            {OUTILS.map((outil) => (
              <Button
                key={outil.id}
                type="button"
                variant={outilActifId === outil.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => onChoisirOutil(outil)}
              >
                {outil.libelle}
              </Button>
            ))}
          </div>

          {outilActif && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {outilActif.forme === "POINT"
                  ? "Cliquez sur la carte pour placer l'icône (cliquez de nouveau pour la déplacer)."
                  : `Cliquez sur la carte pour placer les sommets (${pointsTemp.length} placé${pointsTemp.length > 1 ? "s" : ""}, ${outilActif.minPoints} minimum)`}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={onAnnulerDessin}>
                Annuler
              </Button>
            </div>
          )}

          <div className="h-[560px] overflow-hidden rounded-md border border-border">
            <MapContainer center={CENTRE_PAR_DEFAUT} zoom={ZOOM_PAR_DEFAUT} className="h-full w-full">
              {vueSatellite ? (
                <>
                  {/* Tuiles Mapbox Satellite relayées par notre backend (voir
                      TuileSatelliteController) — jeton jamais exposé au
                      navigateur. Nécessite d'avoir configuré et activé
                      l'intégration dans Paramètres > Vue satellite. */}
                  <TileLayerAuthentifiee
                    urlModele="/api/cartographie/tuiles-satellite/{z}/{x}/{y}.png"
                    attribution='Imagerie satellite &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                  />
                  {/* Couche séparée (noms de ville/village) — masquable indépendamment
                      de l'imagerie quand elle gêne la lecture précise d'un tracé de
                      zone (voir CoucheEtiquettesLieux et CLAUDE.md). */}
                  {afficherEtiquettes && <CoucheEtiquettesLieux />}
                </>
              ) : (
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              )}
              <CaptureClics actif={outilActif !== null} onClic={onClicCarte} />
              <AjusterVue points={tousLesPoints} />

              {(zones ?? []).map((zone) => (
                <ZoneExistante key={zone.idZoneChantier} zone={zone} />
              ))}

              {outilActif && pointsTemp.length > 0 && (
                <>
                  {outilActif.forme === "POINT" && (
                    <Marker position={pointsTemp[0]} icon={iconePointZoneChantier(outilActif.type, couleurZone)} opacity={0.8} />
                  )}
                  {outilActif.forme === "LIGNE" && (
                    <Polyline positions={pointsTemp} pathOptions={{ color: couleurZone, weight: 4, dashArray: "4 4" }} />
                  )}
                  {outilActif.forme === "POLYGONE" && (
                    <Polygon
                      positions={pointsTemp}
                      pathOptions={{ color: couleurZone, fillColor: couleurZone, fillOpacity: 0.2, weight: 2, dashArray: "4 4" }}
                    />
                  )}
                </>
              )}
            </MapContainer>
          </div>

          {outilActif && pointsTemp.length >= outilActif.minPoints && (
            <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3">
              <div className="min-w-[180px] flex-1 space-y-1">
                <Label htmlFor="nom-element">Nom</Label>
                <Input
                  id="nom-element"
                  value={nomZone}
                  onChange={(e) => setNomZone(e.target.value)}
                  placeholder={TYPE_ZONE_LIBELLE[outilActif.type]}
                />
              </div>
              <div className="space-y-1">
                <Label>Couleur</Label>
                <div className="flex gap-1">
                  {COULEURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-6 w-6 rounded-full border-2"
                      style={{ backgroundColor: c, borderColor: c === couleurZone ? "#000" : "transparent" }}
                      onClick={() => setCouleurZone(c)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={onValiderZone} disabled={!nomZone.trim() || creerZone.isPending}>
                {creerZone.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          )}

          {zones && zones.length > 0 && (
            <div className="space-y-1">
              {zones.map((zone) => (
                <div
                  key={zone.idZoneChantier}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: zone.couleur ?? couleurParDefautType(zone.type) }}
                    />
                    <span className="text-sm">{zone.nom}</span>
                    <span className="text-xs text-muted-foreground">({TYPE_ZONE_LIBELLE[zone.type]})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onRenommerZone(zone)}>
                      Renommer
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onSupprimerZone(zone.idZoneChantier)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {(!zones || zones.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Aucun élément placé pour l'instant — choisis un outil ci-dessus puis clique sur la carte.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
