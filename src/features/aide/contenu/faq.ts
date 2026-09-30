import type { PageFaq, SectionAide } from "@/types/aide";
import { REVISION_INITIALE } from "@/features/aide/contenu/revision";

/**
 * FAQ : questions réelles (posées pendant la mise en place du logiciel),
 * réponses de 2 à 4 lignes, rangées par thème (7 questions au plus par thème).
 * À enrichir avec les questions reçues par message ou par téléphone (étape 7).
 */
function q(id: string, titre: string, reponse: string, extra: Partial<PageFaq> = {}): PageFaq {
  return { type: "FAQ", id, titre, resume: reponse.split(". ")[0] + ".", reponse, revision: REVISION_INITIALE, ...extra };
}

export const themesFaq: SectionAide[] = [
  {
    id: "faq-missions-vehicules",
    titre: "Missions et véhicules",
    icone: "Route",
    pages: [
      q(
        "faq-mission-ou-affectation",
        "Quelle différence entre une mission et une affectation ?",
        "Une mission est un trajet ponctuel, avec un début et une fin prévus. Une affectation attribue durablement un véhicule à un conducteur, sans date de fin. Un véhicule affecté peut quand même partir en mission.",
        { motsCles: ["mission", "affectation", "différence"], voirAussi: ["guide-planifier-mission", "guide-affecter-vehicule"] },
      ),
      q(
        "faq-mission-ne-demarre-pas",
        "Pourquoi ma mission ne veut-elle pas démarrer ?",
        "Au démarrage, l'application vérifie l'assurance et la visite technique du véhicule. Si l'une d'elles manque ou a expiré, le démarrage est refusé. Enregistrez le document à jour, puis recommencez.",
        { motsCles: ["démarrer", "refus", "assurance", "visite technique"], voirAussi: ["depannage-mission-sans-assurance", "guide-enregistrer-document"] },
      ),
      q(
        "faq-couleurs-rapport",
        "Que veulent dire les couleurs du rapport d'un véhicule ?",
        "Vert : tout va bien. Jaune : à surveiller bientôt. Rouge : une action est nécessaire. Gris : une information manque ou n'est pas accessible à votre rôle.",
        { motsCles: ["couleur", "vert", "rouge", "jaune", "gris", "rapport véhicule"], voirAussi: ["guide-consulter-rapport-vehicule"] },
      ),
      q(
        "faq-pas-de-position",
        "Pourquoi un véhicule n'apparaît-il pas sur la carte GPS ?",
        "Seuls les véhicules équipés d'un boîtier actif apparaissent. Si le boîtier est actif mais n'a encore rien envoyé, la carte affiche « aucune position reçue ». Vérifiez le boîtier ou contactez l'administrateur.",
        { motsCles: ["gps", "carte", "invisible", "position"], voirAussi: ["depannage-pas-de-position", "guide-installer-boitier-gps"] },
      ),
      q(
        "faq-presence-chantier",
        "Comment savoir si un véhicule est vraiment sur son chantier ?",
        "Fiche du chantier, onglet **Terrain** : chaque nuit, les positions GPS de la veille sont comparées aux zones du chantier, sinon à un rayon autour de sa position (300 m par défaut). Deux jours d'absence de suite déclenchent une alerte.",
        { motsCles: ["présence", "chantier", "gps", "terrain", "absent", "inactif"], ecrans: ["/chantiers"], capacite: "SUIVI_CHANTIER" },
      ),
      q(
        "faq-demande-materiel",
        "Comment demander un véhicule pour mon chantier ?",
        "Fiche du chantier, onglet **Demandes** : type, quantité, période et priorité. La gestion du parc accepte ou refuse, puis prévoit les véhicules ; vous êtes prévenu par message et la demande passe « servie ».",
        { motsCles: ["demande", "matériel", "véhicule", "chef de chantier", "besoin"], ecrans: ["/chantiers"], capacite: "DEMANDER_MATERIEL" },
      ),
    ],
  },
  {
    id: "faq-carburant",
    titre: "Carburant et consommation",
    icone: "Fuel",
    pages: [
      q(
        "faq-plein-ou-appoint",
        "Dois-je toujours faire le plein complet ?",
        "Non. Choisissez « Appoint » ou « Bidon » quand vous ne remplissez pas le réservoir. La consommation se calcule entre deux pleins complets, appoints compris. Le kilométrage reste obligatoire à chaque saisie.",
        { motsCles: ["plein", "appoint", "bidon", "réservoir"], voirAussi: ["guide-enregistrer-plein"] },
      ),
      q(
        "faq-consommation-anormale",
        "Pourquoi une alerte « consommation anormale » est-elle créée ?",
        "Chaque saisie est comparée en L/100 km à la consommation de référence du véhicule. Au-delà du dépassement toléré, une alerte est créée. Vérifiez le kilométrage saisi, une fuite ou un usage inhabituel.",
        { motsCles: ["consommation", "anormale", "l/100", "alerte carburant"], voirAussi: ["guide-regler-controles", "guide-traiter-alerte"] },
      ),
    ],
  },
  {
    id: "faq-alertes-maintenance",
    titre: "Alertes et maintenance",
    icone: "BellRing",
    pages: [
      q(
        "faq-alerte-monte",
        "Pourquoi la priorité d'une alerte a-t-elle augmenté toute seule ?",
        "Une alerte non traitée monte d'un niveau après un délai : 7 jours de Faible à Moyenne, 3 jours vers Élevée, 2 jours vers Critique. La mention « ↑ depuis … » montre son niveau de départ.",
        { motsCles: ["escalade", "priorité", "critique", "monte"], voirAussi: ["guide-traiter-alerte", "guide-regler-controles"] },
      ),
      q(
        "faq-alerte-close-seule",
        "Pourquoi une alerte s'est-elle fermée toute seule ?",
        "Sa cause a disparu : document renouvelé, maintenance planifiée ou faite, stock réapprovisionné, sortie ou retour de chantier saisi… Dans le filtre **Toutes**, son statut indique « Close auto » et le motif. Le journal d'audit garde la trace.",
        { motsCles: ["close auto", "fermée", "disparue", "automatique", "motif"], voirAussi: ["guide-traiter-alerte"] },
      ),
      q(
        "faq-alertes-gps-repetees",
        "Je reçois la même alerte GPS toutes les 15 minutes : est-ce normal ?",
        "Oui, tant que le problème dure, le contrôle se répète. Les alertes du même type sont regroupées sur une seule ligne avec leur nombre. Un clic sur **Tout traiter** les ferme ensemble.",
        { motsCles: ["gps", "répétée", "15 minutes", "doublon"], voirAussi: ["guide-traiter-alerte"] },
      ),
      q(
        "faq-proforma",
        "Pourquoi dois-je joindre un proforma pour terminer une maintenance ?",
        "Pour une maintenance chez un garage externe, le proforma justifie le coût. Sans lui, le bouton **Terminer** reste bloqué. L'atelier interne n'en demande pas.",
        { motsCles: ["proforma", "garage", "terminer", "facture"], voirAussi: ["guide-terminer-maintenance"] },
      ),
    ],
  },
  {
    id: "faq-comptes",
    titre: "Comptes et accès",
    icone: "Shield",
    pages: [
      q(
        "faq-menu-absent",
        "Pourquoi je ne vois pas un menu qu'un collègue voit ?",
        "Les menus dépendent du rôle de chaque compte. Par exemple, Utilisateurs et Paramètres sont réservés à l'administration. Si vous en avez besoin, demandez un changement de rôle à l'administrateur.",
        { motsCles: ["menu", "absent", "manquant", "invisible", "rôle"], voirAussi: ["demarrer-roles"] },
      ),
      q(
        "faq-mot-de-passe-oublie",
        "J'ai oublié mon mot de passe : que faire ?",
        "Demandez à l'administrateur : dans **Utilisateurs**, le bouton **Mot de passe** en crée un nouveau. Il vous le transmet de vive voix ; changez-le ensuite depuis votre menu.",
        { motsCles: ["mot de passe", "oublié", "perdu", "réinitialiser"], voirAussi: ["depannage-identifiants", "faq-changer-mot-de-passe"] },
      ),
      q(
        "faq-changer-mot-de-passe",
        "Comment changer mon mot de passe ?",
        "Cliquez sur votre avatar en bas de l'écran, puis sur **Changer mon mot de passe**. Il faut au moins 12 caractères : une courte phrase, sans votre nom ni un mot courant, est plus sûre et plus facile à retenir.",
        { motsCles: ["mot de passe", "changer", "modifier", "sécurité", "12 caractères"], voirAussi: ["depannage-mot-de-passe-refuse"] },
      ),
      q(
        "faq-changer-photo",
        "Comment mettre ma photo ?",
        "Cliquez sur votre avatar en bas de l'écran, puis sur **Changer ma photo** : choisissez une image, cadrez-la, enregistrez. Sa position GPS n'est pas conservée. Un conducteur et son compte partagent la même photo ; le responsable du parc peut la mettre depuis **Conducteurs** (**Photo…**).",
        { motsCles: ["photo", "avatar", "profil", "image", "portrait"], ecrans: ["/conducteurs", "/utilisateurs"] },
      ),
    ],
  },
  {
    id: "faq-pilotage-donnees",
    titre: "Pilotage et données",
    icone: "FileBarChart",
    pages: [
      q(
        "faq-recommandations",
        "D'où viennent les recommandations ?",
        "Elles sont calculées à chaque visite à partir des indicateurs existants : coûts, utilisation sur 3 mois, renouvellement, conduite, conformité et budget carburant. Ce sont des règles simples : la décision reste à la direction.",
        { motsCles: ["recommandation", "conseil", "suggestion", "action", "prédictif"], ecrans: ["/recommandations"], capacite: "CONSULTER_GESTION" },
      ),
      q(
        "faq-qualite-donnees",
        "Pourquoi un véhicule est-il « à compléter » ?",
        "Il manque une information dont dépend un indicateur : kilométrage relevé depuis plus de 30 jours, consommation de référence, réservoir, document obligatoire, coûts fixes ou date d'acquisition. Complétez sa fiche.",
        { motsCles: ["qualité", "complétude", "données", "à compléter", "fiche incomplète"], ecrans: ["/suivi-logiciel"], capacite: "ADMINISTRER" },
      ),
      q(
        "faq-adoption",
        "Comment savoir qui utilise vraiment le logiciel ?",
        "Ouvrez **Suivi du logiciel**, onglet **Adoption** : comptes connectés sur 30 jours, connexions et saisies par rôle et par personne. Les connexions sont comptées depuis la mise en service du journal.",
        { motsCles: ["adoption", "utilisation", "connexion", "inactif", "qui utilise"], ecrans: ["/suivi-logiciel"], capacite: "ADMINISTRER" },
      ),
    ],
  },
];
