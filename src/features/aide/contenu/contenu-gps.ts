import type { GroupeAide } from "@/types/aide";

/**
 * GPS & suivi : localisation en temps réel des engins, carte, intégration
 * Traccar (import automatique de positions), et les alertes que tout cela
 * peut déclencher.
 */
export const groupeGps: GroupeAide = {
  id: "gps",
  titre: "GPS & suivi",
  icone: "MapPin",
  articles: [
    {
      id: "gps-dispositifs",
      titre: "GPS — dispositifs, positions, trajets",
      resume:
        "Suivi de la localisation des véhicules équipés d'un dispositif GPS : positions reçues, trajets reconstitués, et détection automatique d'anomalies.",
      fonctionnalites: [
        "Onglet Dispositifs : gérer les boîtiers GPS installés sur les véhicules",
        "Onglet Positions : historique des positions d'un dispositif",
        "Onglet Trajets : reconstitution d'un trajet à partir des positions enregistrées",
        "Onglet Carte : voir « Carte GPS » ci-dessous",
      ],
      reglesCles: [
        "Chaque position reçue déclenche automatiquement les contrôles suivants : survitesse, déplacement anormal, arrêt prolongé, sortie d'une zone interdite, sortie de toutes les zones d'opération autorisées de le véhicule.",
        "Une perte de connexion prolongée d'un dispositif est détectée et signalée.",
        "Un GPS resté désactivé pendant qu'une mission est en cours est signalé.",
      ],
    },
    {
      id: "carte-gps",
      titre: "Carte GPS",
      resume:
        "Vue cartographique (OpenStreetMap) de la flotte en temps réel, avec le détail du trajet d'un véhicule et les zones géographiques superposées.",
      fonctionnalites: [
        "Vue flotte : un marqueur par véhicule équipé d'un GPS actif, coloré selon son statut, actualisé automatiquement toutes les 30 secondes",
        "Vue détaillée : sélectionner un véhicule pour voir son trajet complet (ligne + positions)",
        "Zones géographiques superposées (cercles ou tracés polygonaux, vert = autorisée, rouge = interdite)",
        "Infobulle sur un marqueur : immatriculation (ou n° de série) et modèle du véhicule, statut, dernière transmission, vitesse, photo principale sur demande",
      ],
      reglesCles: [
        "Seuls les véhicules équipés d'un dispositif GPS actif apparaissent sur la vue flotte.",
      ],
    },
    {
      id: "traccar",
      titre: "Intégration Traccar",
      resume:
        "Import automatique de positions GPS depuis un serveur Traccar auto-hébergé, en alternative à l'envoi direct de positions. Se configure entièrement depuis l'écran Paramètres.",
      fonctionnalites: [
        "Activer/désactiver l'intégration",
        "Renseigner l'URL du serveur Traccar et le jeton API",
        "Régler l'intervalle de synchronisation",
      ],
      reglesCles: [
        "Le rapprochement entre un dispositif Traccar et un dispositif GPS de l'application se fait par numéro de série — un dispositif Traccar sans correspondance est simplement ignoré.",
        "Une position importée depuis Traccar déclenche exactement les mêmes contrôles qu'une position envoyée directement (survitesse, zones, etc.).",
        "Un changement de configuration (URL, jeton, intervalle, activation) prend effet sans avoir à redémarrer le serveur.",
        "Le jeton API n'est jamais réaffiché en clair une fois enregistré ; le laisser vide en modification conserve le jeton déjà configuré.",
      ],
      rolesRequis: ["Administrateur, DG ou responsable du parc"],
    },
    {
      id: "alertes",
      titre: "Alertes",
      resume:
        "Liste unique regroupant toutes les alertes de l'application (GPS, stock de pièces, entretien, carburant, documents expirés, incidents critiques).",
      fonctionnalites: [
        "Consulter les alertes (filtre : non traitées / toutes)",
        "Marquer une alerte comme traitée",
      ],
      reglesCles: [
        "Chaque alerte a une priorité (Faible, Moyenne, Élevée, Critique).",
        "Une alerte de priorité Critique déclenche une notification immédiate.",
        "Les alertes très proches dans le temps et similaires sont automatiquement dédupliquées (fenêtre de 15 minutes) pour éviter le bruit.",
      ],
    },
  ],
};
