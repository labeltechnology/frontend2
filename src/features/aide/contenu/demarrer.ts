import type { PageTexte } from "@/types/aide";
import { REVISION_INITIALE } from "@/features/aide/contenu/revision";

/** Rubrique « Démarrer » : présentation, connexion, interface, rôles, premiers pas. */
export const pagesDemarrer: PageTexte[] = [
  {
    type: "TEXTE",
    id: "demarrer-presentation",
    titre: "Découvrir ParcAuto",
    resume: "Ce que fait l'application et comment elle est organisée.",
    revision: REVISION_INITIALE,
    motsCles: ["présentation", "à quoi sert", "logiciel", "parc automobile"],
    sections: [
      {
        titre: "À quoi sert ParcAuto",
        paragraphes: [
          "ParcAuto suit tous les véhicules et engins de chantier de l'entreprise.",
          "Il réunit au même endroit les missions, le carburant, l'entretien, les documents, le GPS et les coûts.",
        ],
      },
      {
        titre: "Ce que vous y faites le plus souvent",
        liste: [
          "Planifier et suivre les missions des véhicules.",
          "Enregistrer les pleins et déclarer les incidents.",
          "Créer et terminer les maintenances.",
          "Traiter les alertes : documents qui expirent, consommation anormale, GPS…",
          "Consulter le rapport d'un véhicule et produire des rapports PDF.",
        ],
      },
    ],
    voirAussi: ["demarrer-connexion", "demarrer-interface", "demarrer-premiers-pas"],
  },
  {
    type: "TEXTE",
    id: "demarrer-connexion",
    titre: "Se connecter pour la première fois",
    resume: "Ouvrir l'application avec l'email et le mot de passe reçus de l'administrateur.",
    revision: REVISION_INITIALE,
    motsCles: ["connexion", "login", "mot de passe", "identifiant", "email", "se connecter", "déconnexion"],
    ecrans: ["/connexion"],
    sections: [
      {
        titre: "Avant de commencer",
        liste: [
          "L'administrateur vous a créé un compte et vous a donné un mot de passe provisoire.",
          "Vous avez l'adresse de l'application dans votre navigateur.",
        ],
      },
      {
        titre: "Étapes",
        liste: [
          "Saisissez votre **Email**.",
          "Saisissez votre **Mot de passe**.",
          "Cliquez sur **Se connecter**.",
        ],
      },
      {
        titre: "Résultat",
        paragraphes: [
          "Le **Tableau de bord** de votre métier s'ouvre (direction, atelier, finances, chantier). Les menus affichés dépendent de votre rôle : chacun ne voit que les pages de son métier.",
          "Conducteur : la **Messagerie** s'ouvre ; le reste de votre travail se fait dans l'application mobile.",
        ],
      },
      {
        titre: "Bon à savoir",
        liste: [
          "Pour vous déconnecter, cliquez sur votre avatar dans la barre en bas, puis sur **Se déconnecter**.",
          "Ne partagez jamais votre mot de passe : chaque action est enregistrée à votre nom.",
        ],
      },
    ],
    captures: [{ fichier: "demarrer-connexion-01.png", alt: "Page de connexion avec les champs Email et Mot de passe", legende: "La page de connexion." }],
    voirAussi: ["depannage-identifiants", "depannage-session-expiree"],
  },
  {
    type: "TEXTE",
    id: "demarrer-interface",
    titre: "Se repérer dans l'interface",
    resume: "La barre de navigation en bas de l'écran et ses menus.",
    revision: REVISION_INITIALE,
    motsCles: ["menu", "navigation", "barre", "thème", "sombre", "nuit", "recherche de page", "où trouver"],
    sections: [
      {
        titre: "La barre de navigation",
        paragraphes: [
          "Tous les menus sont dans la barre flottante, en bas de l'écran.",
          "Sur téléphone, les menus n'affichent que leur icône.",
        ],
        tableau: {
          colonnes: ["Élément", "À quoi il sert"],
          lignes: [
            ["**Tableau de bord**", "Page d'accueil de votre métier : chiffres clés, liste « À traiter », planning ou factures selon le rôle."],
            ["**Pilotage**", "Analytique, Performance, Coûts, Fiabilité, Renouvellement, Recommandations, Rapports."],
            ["**Parc**", "Véhicules, types, documents, conducteurs, zones."],
            ["**Exploitation**", "Missions, affectations, chantiers, GPS, carburant, incidents, alertes."],
            ["**Atelier**", "Maintenance, garages externes, fournisseurs."],
            ["**Finances**", "Locations, prestataires, factures proforma, export comptable."],
            ["**Administration**", "Mise en service, utilisateurs, paramètres, import, journal d'audit, aide."],
            ["★", "Vos pages favorites et les pages ouvertes récemment (étoile à côté du titre d'une page)."],
            ["**Messagerie**", "Messages entre collègues ; une pastille compte les non-lus."],
            ["Loupe", "Trouver un véhicule, une mission, un chantier, un conducteur, une action ou une page (Ctrl+K)."],
            ["**?**", "Aide sur la page où vous êtes."],
            ["Soleil / lune", "Thème clair ou sombre."],
            ["Avatar", "Votre compte, **Paramètres** et déconnexion."],
          ],
        },
      },
    ],
    schema: "barre-navigation",
    captures: [{ fichier: "demarrer-barre-navigation-01.png", alt: "Barre de navigation flottante en bas de l'écran, numérotée de 1 à 13", legende: "La barre de navigation." }],
    voirAussi: ["demarrer-roles", "faq-menu-absent"],
  },
  {
    type: "TEXTE",
    id: "demarrer-roles",
    titre: "Comprendre ce que votre rôle permet",
    resume: "Les huit rôles de l'application et ce que chacun peut faire.",
    revision: REVISION_INITIALE,
    motsCles: ["rôle", "droits", "autorisation", "accès refusé", "profil", "permission"],
    sections: [
      {
        titre: "Les rôles",
        paragraphes: ["Votre rôle décide des menus et des boutons que vous voyez. Le serveur vérifie aussi chaque action."],
        tableau: {
          colonnes: ["Rôle", "Peut faire"],
          lignes: [
            ["Directeur général", "Tout."],
            ["Responsable du parc", "Tout le métier : véhicules, missions, maintenance, alertes, rapports, comptes."],
            ["Assistant du responsable", "Consulter ; proposer missions, chantiers et maintenances."],
            ["Chef de maintenance", "Toute la maintenance : interventions, pièces, garages, entretien."],
            ["Assistant maintenance", "Consulter ; planifier des maintenances."],
            ["Conducteur", "Son véhicule : pleins, incidents, départ et retour de mission."],
            ["Administrateur (informatique)", "Comptes, paramètres, journal d'audit ; lecture du métier."],
            ["Comptable", "Consulter, notamment factures et rapports."],
            ["Chef de chantier", "Demander du matériel et tenir le journal de ses chantiers ; consulter leur terrain."],
          ],
        },
      },
      {
        titre: "Bon à savoir",
        liste: [
          "Dans chaque guide, la mention « Réservé à » indique les rôles nécessaires.",
          "Pour changer de rôle, adressez-vous à l'administrateur.",
        ],
      },
    ],
    voirAussi: ["faq-menu-absent", "depannage-acces-refuse"],
  },
  {
    type: "TEXTE",
    id: "demarrer-premiers-pas",
    titre: "Faire ses premiers pas selon son rôle",
    resume: "Les trois guides à lire en premier, selon votre métier.",
    revision: REVISION_INITIALE,
    motsCles: ["débuter", "nouveau", "formation", "par où commencer", "prise en main"],
    sections: [
      {
        titre: "Par où commencer",
        tableau: {
          colonnes: ["Vous êtes", "À lire d'abord"],
          lignes: [
            ["Conducteur", "Enregistrer un plein · Démarrer puis terminer une mission · Déclarer un incident"],
            ["Responsable du parc", "Planifier une mission · Traiter une alerte · Consulter le rapport d'un véhicule"],
            ["Chef ou assistant maintenance", "Créer une maintenance · Terminer une maintenance · Replanifier une maintenance"],
            ["Direction, comptable", "Générer un rapport · Consulter le rapport d'un véhicule"],
            ["Administrateur", "Créer un compte utilisateur · Régler le contrôle de consommation"],
          ],
        },
      },
      {
        titre: "Objectif",
        paragraphes: ["Être autonome sur ses tâches courantes en moins de 30 minutes."],
      },
    ],
    voirAussi: ["guide-enregistrer-plein", "guide-planifier-mission", "guide-creer-maintenance", "guide-generer-rapport"],
  },
];
