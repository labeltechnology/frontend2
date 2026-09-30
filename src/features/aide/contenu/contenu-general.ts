import type { GroupeAide } from "@/types/aide";

/**
 * Général : connexion à l'application et tableau de bord d'accueil.
 * Les deux écrans que tout utilisateur voit en premier, quel que soit son rôle.
 */
export const groupeGeneral: GroupeAide = {
  id: "general",
  titre: "Général",
  icone: "LayoutDashboard",
  articles: [
    {
      id: "authentification",
      titre: "Connexion",
      resume:
        "Accès à l'application par email et mot de passe. Un jeton de session (JWT) est délivré à la connexion et utilisé pour tous les appels au serveur.",
      fonctionnalites: [
        "Connexion par email + mot de passe",
        "Déconnexion : avatar de la barre en bas, puis « Se déconnecter »",
      ],
      reglesCles: [
        "Chaque adresse email n'est utilisée que par un seul compte.",
        "Le mot de passe n'est jamais stocké en clair (chiffrement BCrypt).",
        "Un compte désactivé par un administrateur ne peut plus se connecter, même avec le bon mot de passe.",
      ],
      astuces: [
        "Les menus et pages affichés dépendent du rôle du compte connecté (ex. Utilisateurs et Journal d'audit ne sont visibles que pour un administrateur).",
      ],
    },
    {
      id: "tableau-de-bord",
      titre: "Tableau de bord",
      resume:
        "Page d'accueil : vue d'ensemble chiffrée du parc, des missions en cours et des alertes actives, calculée en direct à chaque visite (aucune donnée figée).",
      fonctionnalites: [
        "4 indicateurs clés : véhicules au parc, véhicules disponibles, véhicules en mission, alertes actives",
        "Répartition du parc par statut (barre + légende)",
        "Missions en cours, avec une barre de progression basée sur les dates prévues",
        "Alertes récentes",
        "Activité récente du journal d'audit (administrateur / responsable de parc uniquement)",
      ],
      reglesCles: [
        "Toutes les valeurs affichées viennent des données réelles du moment — rien n'est une donnée de démonstration.",
      ],
      rolesRequis: ["Panneau « Activité récente » : administrateur, DG ou responsable du parc"],
    },
  ],
};
