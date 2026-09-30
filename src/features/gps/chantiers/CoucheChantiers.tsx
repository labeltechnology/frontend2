import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Circle, GeoJSON, Marker, Polyline, Popup } from "react-leaflet";
import {
  TYPE_ZONE_LIBELLE,
  couleurParDefautType,
  iconePointZoneChantier,
  parserGeometrie,
} from "@/features/chantiers/zone-chantier-rendu";
import {
  COULEUR_STATUT_CHANTIER,
  COULEUR_TON,
  LIBELLE_STATUT_CHANTIER,
  centreChantier,
  resumeVehicules,
  situation,
  sommetsGeoJson,
  textePerimetre,
} from "@/features/gps/chantiers/carte-chantiers";
import { iconeChantier } from "@/features/gps/chantiers/icone-chantier";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ChantierCarte } from "@/types/carte-gps";

/**
 * Chantiers sur la carte GPS (2026-09-30) : repère + bulle, périmètre de
 * présence (pointillés, même règle que le calcul de présence) et plan du
 * chantier (locaux, stockage, route…). Utilisé par la vue flotte et par le
 * trajet d'un véhicule.
 */
export function CoucheChantiers({
  chantiers,
  afficherPerimetre,
  afficherPlan,
}: {
  chantiers: readonly ChantierCarte[];
  afficherPerimetre: boolean;
  afficherPlan: boolean;
}) {
  return (
    <>
      {chantiers.map((c) => (
        <Fragment key={c.idChantier}>
          {afficherPerimetre && <PerimetreChantier chantier={c} />}
          {afficherPlan && <PlanChantier chantier={c} />}
          <RepereChantier chantier={c} />
        </Fragment>
      ))}
    </>
  );
}

function RepereChantier({ chantier: c }: { chantier: ChantierCarte }) {
  const centre = centreChantier(c);
  if (!centre) return null;
  return (
    <Marker position={centre} icon={iconeChantier(c.statut)} zIndexOffset={-100}>
      <Popup>
        <div className="min-w-[220px] max-w-[280px] space-y-1.5 text-sm">
          <p className="font-medium">{c.nom}</p>
          {c.lieu && <p className="text-xs text-muted-foreground">{c.lieu}</p>}
          <p className="text-xs">
            <span className="font-medium" style={{ color: COULEUR_STATUT_CHANTIER[c.statut] }}>
              {LIBELLE_STATUT_CHANTIER[c.statut]}
            </span>
            {" · "}du {formatDate(c.dateDebutPrevue)} au {formatDate(c.dateFinPrevue)}
          </p>
          <p className="text-xs text-muted-foreground">Périmètre : {textePerimetre(c.sourcePerimetre, c.rayonPresenceMetres)}</p>
          <p className="text-xs font-medium">{resumeVehicules(c)}</p>
          {c.vehicules.length > 0 && (
            <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {c.vehicules.map((v) => {
                const s = situation(v, c.nom);
                return (
                  <li key={v.idEngin} className="flex items-start gap-1.5">
                    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: COULEUR_TON[s.ton] }} />
                    <span>
                      {v.libelleVehicule ?? "Véhicule"}
                      <span className="text-muted-foreground">
                        {s.ton === "dedans" && " — sur place"}
                        {s.ton === "dehors" && " — hors du chantier"}
                        {s.ton === "inconnu" && " — position inconnue"}
                        {s.ton === "a-venir" && v.dateDebutPrevue && ` — à partir du ${formatDate(v.dateDebutPrevue)}`}
                        {v.horodatagePosition && s.ton !== "a-venir" && ` (${formatDateTime(v.horodatagePosition)})`}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to={`/chantiers/${c.idChantier}/fiche`} className="inline-block text-xs font-medium text-primary underline-offset-2 hover:underline">
            Ouvrir la fiche du chantier
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}

/** Périmètre de présence en pointillés : cercle autour du repère, ou zones du plan élargies du rayon. */
function PerimetreChantier({ chantier: c }: { chantier: ChantierCarte }) {
  const couleur = COULEUR_STATUT_CHANTIER[c.statut];
  const trait = { color: couleur, weight: 2, dashArray: "6 6", fillColor: couleur, fillOpacity: 0.06 };
  const bulle = (
    <Popup>
      Périmètre de « {c.nom} » : {textePerimetre(c.sourcePerimetre, c.rayonPresenceMetres)}
    </Popup>
  );
  if (c.sourcePerimetre === "RAYON" && c.latitude != null && c.longitude != null) {
    return (
      <Circle center={[c.latitude, c.longitude]} radius={c.rayonPresenceMetres} pathOptions={trait}>
        {bulle}
      </Circle>
    );
  }
  if (c.sourcePerimetre !== "ZONES") return null;
  return (
    <>
      {c.zones.map((zone) => {
        const geometrie = parserGeometrie(zone.geometrieGeoJson);
        const sommets = sommetsGeoJson(zone.geometrieGeoJson);
        if (!geometrie || sommets.length === 0) return null;
        if (geometrie.type === "Point") {
          return (
            <Circle key={zone.idZoneChantier} center={sommets[0]} radius={c.rayonPresenceMetres} pathOptions={trait}>
              {bulle}
            </Circle>
          );
        }
        if (geometrie.type === "LineString") {
          // Couloir du tracé : Leaflet ne sait pas élargir une ligne en mètres ; trait épais en pointillés.
          return (
            <Polyline key={zone.idZoneChantier} positions={sommets} pathOptions={{ color: couleur, weight: 10, opacity: 0.35, dashArray: "8 8" }}>
              {bulle}
            </Polyline>
          );
        }
        return (
          <GeoJSON key={zone.idZoneChantier} data={geometrie} style={trait}>
            {bulle}
          </GeoJSON>
        );
      })}
    </>
  );
}

/** Plan du chantier (mêmes icônes et couleurs que la carte des chantiers). */
function PlanChantier({ chantier: c }: { chantier: ChantierCarte }) {
  return (
    <>
      {c.zones.map((zone) => {
        const geometrie = parserGeometrie(zone.geometrieGeoJson);
        if (!geometrie) return null;
        const libelle = `${zone.nom} — ${TYPE_ZONE_LIBELLE[zone.type]} (${c.nom})`;
        if (geometrie.type === "Point") {
          const [position] = sommetsGeoJson(zone.geometrieGeoJson);
          if (!position) return null;
          return (
            <Marker key={zone.idZoneChantier} position={position} icon={iconePointZoneChantier(zone.type, zone.couleur ?? undefined)}>
              <Popup>{libelle}</Popup>
            </Marker>
          );
        }
        const couleur = zone.couleur ?? couleurParDefautType(zone.type) ?? COULEUR_STATUT_CHANTIER[c.statut];
        const style =
          geometrie.type === "LineString"
            ? { color: couleur, weight: 5, opacity: 0.85 }
            : { color: couleur, fillColor: couleur, fillOpacity: 0.18, weight: 2 };
        return (
          <GeoJSON key={zone.idZoneChantier} data={geometrie} style={style}>
            <Popup>{libelle}</Popup>
          </GeoJSON>
        );
      })}
    </>
  );
}
