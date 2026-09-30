import type { GroupeAide } from "@/types/aide";

/**
 * Administration : gestion des comptes, traçabilité de l'activité, et
 * paramètres globaux de l'entreprise (identité, TVA, logo, intégration GPS).
 * L'ensemble de ce groupe est réservé aux rôles d'administration.
 */
export const groupeAdministration: GroupeAide = {
  id: "administration",
  titre: "Administration",
  icone: "Shield",
  articles: [
    {
      id: "utilisateurs",
      titre: "Utilisateurs",
      resume: "Gestion des comptes ayant accès à l'application.",
      fonctionnalites: ["Créer / modifier un compte utilisateur", "Désactiver un compte"],
      reglesCles: [
        "Un compte n'est jamais supprimé physiquement, seulement désactivé — l'historique de ses actions reste consultable dans le journal d'audit.",
        "Un compte désactivé ne peut plus se connecter.",
        "Rôles : DG et responsable du parc (tout), assistant du responsable (propose missions, chantiers et maintenances), chef de maintenance (activité maintenance), assistant maintenance (planifie les maintenances), conducteur (son véhicule : consultation, plein, incident), administrateur (comptes et paramètres), comptable (lecture).",
        "Seuls le DG et l'administrateur peuvent attribuer, retirer ou désactiver les rôles DG et Administrateur.",
      ],
      rolesRequis: ["Administrateur, DG ou responsable du parc"],
    },
    {
      id: "journal-audit",
      titre: "Journal d'audit",
      resume:
        "Historique consultable de toutes les opérations significatives effectuées dans l'application (création, modification, suppression, changements de statut…), par utilisateur et par entité.",
      fonctionnalites: ["Rechercher par entité, par utilisateur, par période"],
      reglesCles: [
        "Chaque ligne du journal est définitive (append-only) : rien n'y est jamais modifié ni supprimé.",
        "Contrairement au simple « créé par / modifié par » affiché sur chaque fiche, le journal conserve l'historique complet, pas seulement la dernière opération.",
      ],
      rolesRequis: ["Administrateur, DG ou responsable du parc"],
    },
    {
      id: "parametres",
      titre: "Paramètres",
      resume:
        "Réglages globaux de l'application : identité de l'entreprise, taux de TVA, coordonnées bancaires, logo, et intégration GPS Traccar.",
      fonctionnalites: [
        "Identité de l'entreprise : nom, adresse, contact, NIF, STAT",
        "Taux de TVA appliqué aux nouvelles factures de location et proforma",
        "Coordonnées bancaires affichées sur les factures",
        "Logo de l'entreprise : téléverser, remplacer ou supprimer — affiché en en-tête des factures de location et proforma",
        "Mention libre affichée en pied de page des factures",
        "Section « Intégration GPS (Traccar) » — voir le groupe GPS & suivi",
      ],
      reglesCles: [
        "Un changement de taux de TVA ne s'applique qu'aux factures émises après ce changement — les factures déjà émises gardent le taux qui était en vigueur à leur émission.",
        "Sans logo configuré, les factures s'affichent simplement sans logo (aucun blocage).",
      ],
      astuces: [
        "Le logo accepte les formats JPEG, PNG et WEBP (pas de SVG).",
      ],
      rolesRequis: ["Administrateur, DG ou responsable du parc"],
    },
  ],
};
