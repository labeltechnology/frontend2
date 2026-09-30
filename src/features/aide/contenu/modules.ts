import type { PageGuide, PageReference, SectionAide } from "@/types/aide";
import { guidesCouts } from "@/features/aide/contenu/guides/couts";
import { guidesExploitation } from "@/features/aide/contenu/guides/exploitation";
import { guidesMaintenance } from "@/features/aide/contenu/guides/maintenance";
import { guidesPilotage } from "@/features/aide/contenu/guides/pilotage";
import { guidesSuivi } from "@/features/aide/contenu/guides/suivi";
import { guidesTerrain } from "@/features/aide/contenu/guides/terrain";
import { guidesVehicules } from "@/features/aide/contenu/guides/vehicules";
import { REFERENCE_MODULES } from "@/features/aide/contenu/reference";
import { REVISION_INITIALE } from "@/features/aide/contenu/revision";

/**
 * Rubrique « Guides par tâche » (étape 3) : sept modules, chacun avec ses
 * guides (priorité haute d'abord) et une page « Règles à connaître » qui
 * reprend l'ancien manuel par module (features/aide/contenu/contenu-*.ts).
 */
interface DefinitionModule {
  id: string;
  titre: string;
  description: string;
  icone: string;
  guides: PageGuide[];
  /** Identifiants des articles de l'ancien manuel repris dans « Règles à connaître ». */
  articles: string[];
}

const DEFINITIONS: DefinitionModule[] = [
  {
    id: "vehicules",
    titre: "Véhicules et documents",
    description: "Fiches, compteur, rapport d'un véhicule, assurances et visites techniques.",
    icone: "Car",
    guides: guidesVehicules,
    articles: ["engins", "documents"],
  },
  {
    id: "exploitation",
    titre: "Missions, affectations et chantiers",
    description: "Planifier et suivre l'utilisation des véhicules.",
    icone: "Route",
    guides: guidesExploitation,
    articles: ["missions", "affectations", "chantiers", "conducteurs"],
  },
  {
    id: "terrain",
    titre: "Carburant et incidents",
    description: "Les saisies faites sur le terrain.",
    icone: "Fuel",
    guides: guidesTerrain,
    articles: ["carburant", "incidents"],
  },
  {
    id: "maintenance",
    titre: "Maintenance",
    description: "Interventions, pièces, garages et replanification.",
    icone: "Wrench",
    guides: guidesMaintenance,
    articles: ["maintenance", "garages-externes", "fournisseurs"],
  },
  {
    id: "suivi",
    titre: "GPS, zones et alertes",
    description: "Localiser les véhicules et réagir aux alertes.",
    icone: "MapPin",
    guides: guidesSuivi,
    articles: ["gps-dispositifs", "carte-gps", "zones-geographiques", "alertes", "traccar"],
  },
  {
    id: "locations",
    titre: "Coûts, locations et facturation",
    description: "Coût complet des véhicules, budget carburant, locations et factures.",
    icone: "Handshake",
    guides: guidesCouts,
    articles: [
      "locations-externes",
      "locations-entrantes",
      "prestataires-location",
      "factures-location",
      "factures-garage",
      "factures-proforma",
    ],
  },
  {
    id: "pilotage",
    titre: "Rapports, messagerie et administration",
    description: "Rapports, échanges entre collègues, comptes et réglages.",
    icone: "FileBarChart",
    guides: guidesPilotage,
    articles: ["tableau-de-bord", "rapports", "utilisateurs", "journal-audit", "parametres"],
  },
];

const ORDRE_PRIORITE = { HAUTE: 0, MOYENNE: 1, BASSE: 2 } as const;

function pageReference(def: DefinitionModule): PageReference {
  return {
    type: "REFERENCE",
    id: `reference-${def.id}`,
    titre: `Connaître les règles : ${def.titre.toLowerCase()}`,
    resume: `Ce que fait chaque écran du module et les règles appliquées automatiquement.`,
    revision: REVISION_INITIALE,
    motsCles: ["règles", "fonctionnement", "manuel"],
    articles: def.articles.map((id) => {
      const article = REFERENCE_MODULES.get(id);
      if (!article) throw new Error(`Article d'aide inconnu : ${id}`);
      return article;
    }),
  };
}

export const modulesGuides: SectionAide[] = DEFINITIONS.map((def) => ({
  id: `module-${def.id}`,
  titre: def.titre,
  description: def.description,
  icone: def.icone,
  pages: [
    ...[...def.guides].sort((a, b) => ORDRE_PRIORITE[a.priorite] - ORDRE_PRIORITE[b.priorite]),
    pageReference(def),
  ],
}));
