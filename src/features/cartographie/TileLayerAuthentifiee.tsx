import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { apiClient } from "@/lib/api-client";

interface TileLayerAuthentifieeProps {
  /** Gabarit d'URL avec {z}/{x}/{y}, relatif à notre propre backend (ex. "/api/cartographie/tuiles-satellite/{z}/{x}/{y}.png") — jamais l'URL Nimbo elle-même, qui reste côté serveur. */
  urlModele: string;
  attribution?: string;
  zIndex?: number;
}

/**
 * Variante de L.TileLayer dont chaque tuile est récupérée via apiClient
 * (jeton JWT ajouté automatiquement par l'intercepteur, voir api-client.ts)
 * au lieu d'un <img src="..."> natif. Nécessaire ici : l'endpoint qui sert
 * les tuiles satellite (TuileSatelliteController, backend) exige un
 * utilisateur authentifié — un <img> classique n'envoie pas l'en-tête
 * Authorization, donc chaque tuile échouerait silencieusement (401). Même
 * principe que AuthenticatedImage.tsx (features/engins), adapté au cycle de
 * vie d'une couche de tuiles Leaflet (création/déchargement par tuile,
 * potentiellement des dizaines en simultané, plutôt qu'un seul montage
 * React) — d'où un composant dédié dans ce module cartographie plutôt qu'une
 * réutilisation directe de AuthenticatedImage.
 *
 * L.TileLayer.extend() n'est pas typé par @types/leaflet (API historique
 * "classe" de Leaflet, antérieure à TypeScript) : les casts `any` ci-dessous
 * sont voulus, contenus à ce seul fichier.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- voir le commentaire ci-dessus : L.TileLayer.extend() n'est pas typé par @types/leaflet
const CoucheTuilesAuthentifiee = (L.TileLayer as any).extend({
  createTile(coords: L.Coords, done: (error: Error | undefined, tile: HTMLElement) => void) {
    const tuile = document.createElement("img") as HTMLImageElement;

    apiClient
      .get((this as L.TileLayer).getTileUrl(coords), { responseType: "blob" })
      .then((reponse) => {
        const objectUrl = URL.createObjectURL(reponse.data);
        // Conservé sur l'élément pour pouvoir le révoquer à "tileunload"
        // (voir TileLayerAuthentifiee ci-dessous) — sans ça, chaque tuile
        // chargée fuit sa mémoire au fil des déplacements/zooms sur la carte.
        tuile.dataset.objectUrl = objectUrl;
        tuile.src = objectUrl;
        done(undefined, tuile);
      })
      .catch(() => {
        done(new Error("Tuile satellite indisponible"), tuile);
      });

    return tuile;
  },
});

/**
 * Équivalent authentifié de <TileLayer> (react-leaflet) — à utiliser pour la
 * vue satellite Nimbo, protégée côté backend comme le reste de l'API. Pour
 * une couche qui n'a pas besoin d'authentification (OpenStreetMap, Esri),
 * le <TileLayer> standard reste préférable (plus simple, pas de fetch par
 * tuile).
 */
export function TileLayerAuthentifiee({ urlModele, attribution, zIndex }: TileLayerAuthentifieeProps) {
  const map = useMap();

  useEffect(() => {
    const couche = new CoucheTuilesAuthentifiee(urlModele, { attribution, zIndex }) as L.TileLayer;

    couche.on("tileunload", (e: L.TileEvent) => {
      const objectUrl = (e.tile as HTMLImageElement).dataset.objectUrl;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    });

    couche.addTo(map);
    return () => {
      map.removeLayer(couche);
    };
  }, [map, urlModele, attribution, zIndex]);

  return null;
}
