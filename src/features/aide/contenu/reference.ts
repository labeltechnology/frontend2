import type { ArticleAide } from "@/types/aide";
import { groupeAdministration } from "@/features/aide/contenu/contenu-administration";
import { groupeEntretien } from "@/features/aide/contenu/contenu-entretien";
import { groupeFacturation } from "@/features/aide/contenu/contenu-facturation";
import { groupeGeneral } from "@/features/aide/contenu/contenu-general";
import { groupeGps } from "@/features/aide/contenu/contenu-gps";
import { groupeLocations } from "@/features/aide/contenu/contenu-locations";
import { groupeParc } from "@/features/aide/contenu/contenu-parc";
import { groupeRapports } from "@/features/aide/contenu/contenu-rapports";

/**
 * Ancien manuel par module (un article par écran), gardé comme référence :
 * chaque article est repris dans la page « Règles à connaître » d'un module
 * des Guides par tâche (voir modules.ts). Indexé par identifiant d'article.
 */
export const REFERENCE_MODULES: ReadonlyMap<string, ArticleAide> = new Map(
  [groupeGeneral, groupeParc, groupeGps, groupeEntretien, groupeLocations, groupeFacturation, groupeRapports, groupeAdministration]
    .flatMap((groupe) => groupe.articles)
    .map((article) => [article.id, article]),
);
