import { TileLayer } from "react-leaflet";

/**
 * Couche de noms de lieux (villes, chefs-lieux) superposée à la carte —
 * couche SÉPARÉE et masquable indépendamment de l'imagerie satellite (voir
 * CLAUDE.md, section « Cartographie (vue satellite) ») : le but est de
 * pouvoir cacher le texte quand il gêne la lecture précise d'un tracé de
 * zone.
 *
 * Historique (2026-09-22) — trois essais avant celui-ci :
 * 1. Service tuilé Esri `Reference/World_Boundaries_and_Places` (celui
 *    utilisé ici) : gratuit, sans jeton, fiable, mais n'a pas les
 *    hameaux/villages dans les zones rurales de Madagascar (seulement
 *    villes/chefs-lieux).
 * 2. CARTO (labels-only, basé OpenStreetMap, même couverture détaillée que
 *    la vue « Plan ») : écarté, exige désormais une clé API (payant/à
 *    quota depuis début 2026).
 * 3. Requêtes directes à OpenStreetMap via l'API Overpass publique
 *    (overpass-api.de), sans jeton : écarté après test — le service
 *    rejette en pratique ce type d'usage (sa politique impose un serveur
 *    auto-hébergé ou payant pour un usage commercial, pas des appels
 *    directs depuis le navigateur d'une appli en production), plus rien
 *    ne s'affichait.
 *
 * Choix retenu avec l'utilisateur : revenir à Esri (option 1) — fiable et
 * sans jeton, au prix de ne montrer que les villes/chefs-lieux, pas les
 * petits villages. À revoir si une source gratuite, fiable et à couverture
 * complète (villages inclus) apparaît plus tard.
 *
 * Service public Esri, sans jeton — contrairement aux tuiles satellite, elle
 * n'a donc pas besoin de passer par notre proxy backend authentifié (voir
 * TileLayerAuthentifiee) : un <TileLayer> standard suffit, chargé
 * directement par le navigateur.
 *
 * Ordre d'URL {z}/{y}/{x} : convention ArcGIS REST — différente de l'ordre
 * {z}/{x}/{y} des autres couches de ce projet (Leaflet substitue les
 * variables quel que soit leur ordre dans le gabarit, donc ça ne pose pas
 * de problème).
 */
export function CoucheEtiquettesLieux() {
  return (
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      attribution='Repères &copy; <a href="https://www.esri.com">Esri</a>'
      // Au-dessus de la couche satellite (zIndex par défaut 1) sans la masquer :
      // cette couche ne contient que du texte/des traits sur fond transparent.
      zIndex={2}
    />
  );
}
