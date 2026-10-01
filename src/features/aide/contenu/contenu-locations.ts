import type { GroupeAide } from "@/types/aide";

/**
 * Locations & prestataires : les deux sens de location d'un véhicule (l'entreprise
 * loue SES engins à un tiers, ou loue un engin CHEZ un tiers), ainsi que les
 * fiches maîtresses de prestataires et de fournisseurs qui leur sont associées.
 */
export const groupeLocations: GroupeAide = {
  id: "locations",
  titre: "Locations et prestataires",
  icone: "Handshake",
  articles: [
    {
      id: "locations-externes",
      titre: "Locations externes",
      resume:
        "L'entreprise loue l'un de ses propres véhicules à une société externe — l'entreprise reste propriétaire du véhicule pendant toute la durée du contrat.",
      fonctionnalites: [
        "Créer un contrat de location (véhicule, société locataire, dates)",
        "Fixer/modifier le tarif journalier",
        "Clôturer un contrat",
        "« Factures » : émettre une facture pour une période, aperçu PDF, marquer payée / annuler",
      ],
      reglesCles: [
        "Un véhicule ne peut avoir qu'un seul contrat de location externe actif à la fois.",
        "Le montant d'une facture est égal au tarif journalier × nombre de jours de la période choisie.",
        "Les factures sont toujours créées manuellement pour une période choisie, jamais générées automatiquement.",
        "Le tarif appliqué et la TVA sont figés au moment de l'émission de la facture : un changement ultérieur du tarif du contrat ou du taux de TVA ne modifie jamais une facture déjà émise.",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
    {
      id: "locations-entrantes",
      titre: "Locations entrantes",
      resume:
        "Sens inverse des Locations externes : l'entreprise loue un véhicule auprès d'un prestataire externe pour son propre usage, en général quand aucun véhicule disponible du type requis n'est au parc.",
      fonctionnalites: [
        "Créer un contrat de location (véhicule déjà existant au parc, prestataire, dates)",
        "Fixer/modifier le tarif journalier",
        "Clôturer un contrat",
        "Enregistrer les factures reçues du prestataire, marquer payée / annuler",
      ],
      reglesCles: [
        "Le véhicule loué doit déjà exister comme véhicule normal du parc (créé au préalable via l'écran Véhicules) — ce module se contente de le rattacher à un prestataire et une période.",
        "Pendant la location, le véhicule reste utilisable normalement : missions, suivi GPS, maintenance, etc.",
        "Un véhicule ne peut avoir qu'un seul contrat de location entrante actif à la fois.",
        "Les factures reçues n'ont pas de TVA (ce sont des dépenses reçues, pas des documents émis par l'entreprise) et n'ont pas d'aperçu PDF (ce n'est pas un document que l'entreprise produit).",
      ],
      astuces: [
        "À ne pas confondre avec « Locations externes » : ici l'entreprise est locataire, pas loueur.",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
    {
      id: "prestataires-location",
      titre: "Prestataires de location",
      resume:
        "Répertoire des sociétés externes chez qui l'entreprise peut louer un véhicule — évite de ressaisir les coordonnées à chaque nouveau contrat de location entrante.",
      fonctionnalites: ["Créer / modifier une fiche prestataire", "Activer / désactiver"],
      reglesCles: [
        "Seuls les prestataires actifs apparaissent dans le sélecteur d'un nouveau contrat de location entrante.",
        "Un prestataire désactivé reste visible dans l'historique des contrats déjà créés.",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
    {
      id: "fournisseurs",
      titre: "Fournisseurs",
      resume: "Fiches des fournisseurs de pièces détachées, utilisables lors de la saisie d'une pièce (module Maintenance).",
      fonctionnalites: ["Créer / modifier une fiche fournisseur", "Activer / désactiver"],
      reglesCles: [],
    },
  ],
};
