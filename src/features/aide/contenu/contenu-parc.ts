import type { GroupeAide } from "@/types/aide";

/**
 * Parc & exploitation : les engins eux-mêmes, qui les conduit, les missions
 * qu'ils effectuent, leur rattachement durable à un conducteur ou à un
 * chantier, et les zones géographiques qui encadrent leurs déplacements.
 */
export const groupeParc: GroupeAide = {
  id: "parc",
  titre: "Parc et exploitation",
  icone: "Truck",
  articles: [
    {
      id: "engins",
      titre: "Véhicules",
      resume:
        "Fiche de chaque véhicule ou engin de chantier du parc : identité, statut, kilométrage, équipement GPS, photos, zones d'opération et situation de location.",
      fonctionnalites: [
        "Créer / modifier une fiche véhicule",
        "Changer le statut (Disponible, En mission, En panne, En maintenance, Affecté, Réformé, Vendu)",
        "Mettre à jour le kilométrage",
        "Activer/désactiver l'équipement GPS",
        "Galerie de photos réelles : ajouter, définir la photo principale, supprimer",
        "Zones d'opération autorisées : affecter une ou plusieurs zones dans lesquelles le véhicule est censé rester",
        "Colonne « Location » : signale si le véhicule est loué à un client (Locations externes) ou loué chez un prestataire (Locations entrantes)",
      ],
      reglesCles: [
        "L'immatriculation (ou le numéro de série pour un engin de chantier) de chaque véhicule est unique dans tout le parc ; le code interne est attribué automatiquement et n'est pas affiché.",
        "Le kilométrage ne peut jamais diminuer — une saisie inférieure au kilométrage déjà enregistré est refusée.",
        "La disponibilité du véhicule découle directement de son statut (un véhicule « En mission » ou « En panne » n'est pas proposé comme disponible).",
        "L'équipement GPS est facultatif : un véhicule peut très bien ne pas être suivi par GPS.",
        "Seules les zones de type « Autorisée » peuvent être affectées comme zone d'opération (une zone « Interdite » n'a pas de sens ici, elle est déjà surveillée indépendamment).",
        "Un véhicule sortant de toutes ses zones d'opération affectées à la fois déclenche une alerte — tant qu'il reste dans au moins une zone affectée, aucune alerte.",
      ],
      astuces: [
        "La suppression d'une photo est définitive (contrairement aux documents administratifs, qui sont versionnés — voir « Documents »).",
        "Un véhicule sans zone d'opération affectée n'est simplement pas surveillé sur ce plan.",
      ],
    },
    {
      id: "conducteurs",
      titre: "Conducteurs",
      resume: "Fiche de chaque conducteur : identité, permis de conduire et disponibilité.",
      fonctionnalites: [
        "Créer / modifier une fiche conducteur",
        "Suspendre un conducteur / le réactiver",
      ],
      reglesCles: [
        "Le matricule de chaque conducteur est unique.",
        "Le permis de conduire et sa date d'expiration sont suivis ; un permis expiré est signalé.",
        "Statut du conducteur : En service, Suspendu, En congé ou Inactif.",
      ],
    },
    {
      id: "missions",
      titre: "Missions",
      resume:
        "Trajet ponctuel confié à un conducteur avec un véhicule, sur une période donnée — à ne pas confondre avec une affectation durable (voir « Affectations »).",
      fonctionnalites: [
        "Créer une mission (véhicule, conducteur, dates prévues)",
        "Démarrer / terminer / annuler une mission",
      ],
      reglesCles: [
        "Cycle de vie : Planifiée → En cours → Terminée ou Annulée.",
        "Un conducteur ne peut pas avoir deux missions qui se chevauchent dans le temps.",
        "Le kilométrage au retour doit être supérieur ou égal au kilométrage de départ.",
        "Une annulation exige un motif.",
        "Un véhicule sans assurance valide ou sans visite technique valide ne peut pas démarrer de mission — le contrôle a lieu au moment du démarrage, pas à la planification.",
      ],
    },
    {
      id: "affectations",
      titre: "Affectations",
      resume:
        "Attribution durable d'un véhicule à un conducteur (par opposition à une mission, qui est un trajet ponctuel). Fait passer le véhicule de Disponible à Affecté.",
      fonctionnalites: ["Créer une affectation", "Terminer / annuler une affectation"],
      reglesCles: [
        "Une annulation exige un motif.",
        "Un conflit d'affectation (véhicule ou conducteur déjà engagé) est détecté avant l'enregistrement.",
      ],
    },
    {
      id: "chantiers",
      titre: "Chantiers",
      resume:
        "Suivi des chantiers de l'entreprise : planification, véhicules et conducteurs rattachés, avancement, journal, coûts et zones délimitées sur le terrain (local technique, local médical…).",
      fonctionnalites: [
        "Liste enrichie : chantiers en cours, à venir, non démarrés ou en retard, recherche, filtres, avancement et alertes",
        "Fiche chantier : position, identification, véhicules et conducteurs à glisser-déposer, chacun avec sa période",
        "Onglet « Journal » : météo, effectif, travaux, incidents, heures des véhicules et photos, jour par jour",
        "Onglet « Coûts » : carburant, maintenance et coûts fixes par véhicule sur sa période, rentabilité, facture pro forma, export Excel",
        "Rubrique « Organisation » : type de chantier, priorité, chef de chantier, rayon de présence GPS, budget matériel, client",
        "Onglet « Terrain » : présence GPS par jour, km, disponibilité, utilisation réelle, sorties et retours avec photos",
        "Onglet « Incidents » : incidents et maintenances du chantier, causes, remplacement d'un véhicule en panne",
        "Onglet « Demandes » : demandes de matériel du chantier ; page Chantiers : demandes, rentabilité, analyse",
        "Démarrer / terminer / annuler un chantier",
        "« Zones du chantier » : tracer des zones directement sur une carte OpenStreetMap (clic pour placer les sommets), les nommer et les colorer",
      ],
      reglesCles: [
        "Cycle de vie : Planifié → En cours → Terminé ou Annulé.",
        "Une annulation exige un motif (255 caractères maximum) ; un chantier ne peut plus démarrer après sa date de fin prévue.",
        "Terminer ou annuler un chantier libère ses véhicules et ses conducteurs.",
        "Un conducteur ne peut pas être sur deux chantiers à la fois, sauf si les deux rattachements sont « multi-sites » ; une mission bloque toujours.",
        "Des alertes signalent un chantier non démarré, en retard, ou un véhicule prévu en panne ou en maintenance dans les 3 jours.",
        "Le journal s'écrit pendant le chantier et jusqu'à 7 jours après sa fin ; les coûts sont arrêtés à la date du jour, sans prévision.",
        "Un véhicule est « sur le chantier » s'il est dans une zone tracée, ou à moins du rayon de présence (300 m par défaut) ; calculé chaque nuit.",
        "Un véhicule réservé aux chantiers critiques ne va que sur un chantier de priorité « Critique ».",
        "Un incident ou une maintenance est rattaché d'office au chantier où se trouvait le véhicule ce jour-là.",
        "Le chef de chantier demande du matériel et tient le journal de ses chantiers ; la gestion du parc répond aux demandes.",
        "Les zones du chantier utilisent de vraies coordonnées géographiques (comme les zones GPS) plutôt qu'un plan image — elles sont donc directement situées sur la carte, pas seulement sur un schéma.",
      ],
      astuces: [
        "Une zone de chantier nécessite au moins 3 sommets pour être enregistrée.",
      ],
    },
    {
      id: "zones-geographiques",
      titre: "Zones géographiques",
      resume:
        "Zones cartographiques utilisées pour la surveillance GPS des véhicules : autoriser une zone d'opération ou interdire une zone d'accès.",
      fonctionnalites: [
        "Créer une zone en mode Cercle (centre + rayon) ou Polygone (tracé GeoJSON)",
        "Activer / désactiver une zone",
        "Visualisation superposée sur la carte GPS (cercles verts pour les zones autorisées, rouges pour les zones interdites)",
      ],
      reglesCles: [
        "Deux types de zone : Autorisée (utilisée comme zone d'opération d'un véhicule) ou Interdite (surveillée en permanence, indépendamment de tout véhicule).",
        "Une zone désactivée n'est plus prise en compte par la surveillance GPS.",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
  ],
};
