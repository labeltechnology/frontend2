import type { GroupeAide } from "@/types/aide";

/**
 * Entretien & consommation : tout ce qui garde un engin en état de rouler —
 * maintenance et pièces, garages externes, carburant, documents administratifs
 * et déclaration des incidents/accidents.
 */
export const groupeEntretien: GroupeAide = {
  id: "entretien",
  titre: "Entretien & consommation",
  icone: "Wrench",
  articles: [
    {
      id: "maintenance",
      titre: "Maintenance & pièces",
      resume:
        "Suivi des interventions d'entretien (atelier interne ou garage externe) et des pièces utilisées, avec calcul automatique du coût.",
      fonctionnalites: [
        "Onglet Maintenances : créer, démarrer, ajouter des pièces, clôturer une intervention",
        "Onglet Pièces : gérer le stock de pièces, assigner un fournisseur",
        "Assigner un garage externe à une intervention (laisser vide = atelier interne)",
        "Téléverser le proforma d'un garage externe avant de clôturer une intervention externe",
      ],
      reglesCles: [
        "Le coût total d'une intervention est calculé automatiquement à partir des pièces utilisées.",
        "Le prix d'une pièce est figé au moment où elle est utilisée sur une intervention (un changement de prix ultérieur ne modifie jamais une intervention déjà enregistrée).",
        "La prochaine date d'entretien et son rappel sont calculés automatiquement à la clôture.",
        "Une alerte est déclenchée si le stock d'une pièce descend en dessous du seuil bas.",
        "Une intervention rattachée à un garage externe ne peut pas être clôturée tant qu'aucun proforma n'a été téléversé — le bouton « Terminer » reste bloqué, ce n'est pas un simple avertissement.",
      ],
    },
    {
      id: "garages-externes",
      titre: "Garages externes",
      resume: "Fiches des garages externes auxquels une intervention peut être confiée, et facturation de leurs interventions.",
      fonctionnalites: [
        "Créer / modifier une fiche garage, activer/désactiver",
        "« Factures » : émettre la facture d'une intervention terminée, marquer payée / annuler",
      ],
      reglesCles: [
        "Le montant d'une facture de garage reprend directement le coût total déjà calculé de l'intervention — jamais de saisie manuelle.",
        "Une facture correspond à une seule intervention (pas de regroupement de plusieurs interventions sur une facture).",
        "Une intervention déjà facturée ne peut pas l'être une seconde fois.",
      ],
    },
    {
      id: "carburant",
      titre: "Carburant",
      resume: "Enregistrement des pleins de carburant et suivi de la consommation moyenne de chaque véhicule.",
      fonctionnalites: [
        "Enregistrer un plein (quantité, prix unitaire, kilométrage)",
        "Consulter la consommation moyenne (L/100 km) d'un véhicule",
        "Joindre un reçu/facture (optionnel)",
      ],
      reglesCles: [
        "Le montant du plein est calculé automatiquement : quantité × prix unitaire.",
        "Le kilométrage saisi au plein suit la même règle que partout ailleurs : il ne peut jamais diminuer.",
        "Une consommation nettement supérieure à l'historique propre de le véhicule déclenche une alerte « consommation anormale ».",
      ],
    },
    {
      id: "documents",
      titre: "Documents administratifs",
      resume:
        "Documents rattachés à un véhicule (carte grise, assurance, visite technique…) ou à un conducteur (permis…), avec suivi des dates d'expiration.",
      fonctionnalites: [
        "Ajouter un document",
        "Remplacer un document par une nouvelle version",
      ],
      reglesCles: [
        "Un document est rattaché soit à un véhicule, soit à un conducteur — jamais les deux, jamais aucun des deux.",
        "Remplacer un document archive l'ancienne version plutôt que de la supprimer : l'historique complet reste consultable.",
        "Un rappel est déclenché avant l'expiration d'un document (véhicule ou conducteur).",
      ],
    },
    {
      id: "incidents",
      titre: "Incidents & accidents",
      resume: "Déclaration et suivi des incidents ou accidents impliquant un véhicule.",
      fonctionnalites: [
        "Déclarer un incident (gravité, description, photos/justificatifs)",
        "Assigner un responsable de traitement",
        "Clôturer avec un compte rendu",
      ],
      reglesCles: [
        "Gravité : Faible, Moyenne, Élevée ou Critique.",
        "Assigner un responsable fait passer l'incident de « Déclaré » à « En traitement ».",
        "Un compte rendu est obligatoire pour pouvoir clôturer un incident.",
        "Un incident de gravité Critique déclenche une notification immédiate.",
      ],
    },
  ],
};
