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
        "Page d'accueil propre à chaque métier (2026-09-30), calculée en direct à chaque visite (aucune donnée figée). Chaque chiffre et chaque ligne ouvre la page où agir.",
      fonctionnalites: [
        "Direction (DG, responsable du parc, administrateur) : indicateurs de pilotage avec cible et tendance, alertes, flotte, coûts face au budget, mur du parc, missions, activité récente",
        "Assistant du parc : véhicules, disponibilité, missions, atelier, alertes, incidents, liste « À traiter », carburant du mois",
        "Atelier (chef et assistant maintenance) : interventions en cours, prévues sous 7 jours, en retard, véhicules immobilisés, pièces sous le seuil, alertes de l'atelier, planning, pièces à réapprovisionner",
        "Finances (comptable) : carburant et maintenance du mois, factures à régler et à encaisser, contrats de location actifs et à échéance, interventions de garage sans facture",
        "Chef de chantier : ses chantiers (en cours, en retard, fin proche), véhicules attendus sur place ou hors du chantier, demandes de matériel en attente ou refusées",
      ],
      reglesCles: [
        "Toutes les valeurs affichées viennent des données réelles du moment — rien n'est une donnée de démonstration.",
        "« À traiter » : du plus urgent au moins urgent ; une facture non réglée depuis plus de 30 jours, une maintenance en retard ou un véhicule hors de son chantier y apparaissent.",
        "Chacun ne voit que les données de son métier ; le chef de chantier, seulement ses chantiers.",
      ],
      rolesRequis: ["Panneau « Activité récente » : administrateur, DG ou responsable du parc"],
    },
  ],
};
