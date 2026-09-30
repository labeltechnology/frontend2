import type { RubriqueAide } from "@/types/aide";
import { pageContact, pageNouveautes, pageSuivi } from "@/features/aide/contenu/contact";
import { pagesDemarrer } from "@/features/aide/contenu/demarrer";
import { themesDepannage } from "@/features/aide/contenu/depannage";
import { themesFaq } from "@/features/aide/contenu/faq";
import { modulesGuides } from "@/features/aide/contenu/modules";

/**
 * Centre d'aide (étape 3 de la méthode) : cinq rubriques, classées par ce que
 * l'utilisateur veut faire plutôt que par les menus du logiciel. Pour ajouter
 * une page, on modifie uniquement le fichier de contenu concerné ; les
 * règles d'arborescence et de rédaction sont vérifiées par les tests
 * (verifierCentreAide dans centre-aide.ts).
 */
export const CENTRE_AIDE: RubriqueAide[] = [
  {
    id: "demarrer",
    titre: "Démarrer",
    description: "Découvrir l'application, se connecter, se repérer, comprendre son rôle.",
    icone: "Rocket",
    pages: pagesDemarrer,
    sections: [],
  },
  {
    id: "guides",
    titre: "Guides par tâche",
    description: "Une page par tâche : « Comment faire… ? », étape par étape.",
    icone: "ListChecks",
    pages: [],
    sections: modulesGuides,
  },
  {
    id: "faq",
    titre: "FAQ",
    description: "Les questions déjà posées, avec une réponse courte.",
    icone: "MessageCircleQuestion",
    pages: [],
    sections: themesFaq,
  },
  {
    id: "depannage",
    titre: "Dépannage",
    description: "Un message d'erreur ? Sa cause et la solution.",
    icone: "LifeBuoy",
    pages: [],
    sections: themesDepannage,
  },
  {
    id: "contact",
    titre: "Contact et nouveautés",
    description: "Joindre le support, voir ce qui a changé.",
    icone: "Megaphone",
    pages: [pageContact, pageNouveautes, pageSuivi],
    sections: [],
  },
];
