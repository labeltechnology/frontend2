import type { GroupeAide } from "@/types/aide";

/**
 * Facturation : les trois documents de facturation générés par l'application.
 * Les factures de location et de garage se gèrent depuis leur module d'origine
 * (pas d'écran séparé) ; seules les factures proforma ont leur propre page,
 * n'étant rattachées à aucun contrat.
 */
export const groupeFacturation: GroupeAide = {
  id: "facturation",
  titre: "Facturation",
  icone: "Receipt",
  articles: [
    {
      id: "factures-location",
      titre: "Factures de location",
      resume:
        "Facture émise pour une période de location externe d'un véhicule (référence FL-xxxxx). Elle se gère depuis « Locations externes » → action « Factures » d'un contrat, pas depuis un écran séparé.",
      fonctionnalites: [
        "Émettre une facture pour une période (nécessite un tarif journalier déjà défini sur le contrat)",
        "Aperçu PDF imprimable avant téléchargement",
        "Marquer payée / annuler",
      ],
      reglesCles: [
        "Montant = tarif journalier × nombre de jours de la période.",
        "La TVA appliquée provient du taux configuré dans Paramètres au moment de l'émission, et reste figée ensuite.",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
    {
      id: "factures-garage",
      titre: "Factures de garage",
      resume:
        "Facture d'une intervention de maintenance réalisée par un garage externe (référence FG-xxxxx). Elle se gère depuis « Garages externes » → action « Factures », pas depuis un écran séparé.",
      fonctionnalites: ["Émettre la facture d'une intervention terminée", "Marquer payée / annuler"],
      reglesCles: [
        "Montant = coût total déjà calculé de l'intervention (jamais de saisie manuelle).",
        "Une intervention ne peut être facturée qu'une seule fois.",
        "Pas de TVA sur ce type de facture (périmètre volontairement limité aux factures de location).",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
    {
      id: "factures-proforma",
      titre: "Factures pro forma",
      resume:
        "Devis libre et indépendant (non lié à un contrat de location) : destinataire et lignes de prestations saisis manuellement. Seul document de facturation à avoir sa propre page dans le menu.",
      fonctionnalites: [
        "Créer une facture pro forma (destinataire, lignes libres : libellé / prix unitaire / quantité)",
        "Aperçu PDF",
      ],
      reglesCles: [
        "Aucun statut ni cycle de vie : un devis non engageant se refait plutôt qu'il ne se corrige — pas d'action « payer » ou « annuler ».",
        "Les montants HT/TVA/TTC sont toujours calculés à partir des lignes et du taux de TVA figé à la création, jamais stockés tels quels.",
        "Une facture pro forma n'est jamais convertie automatiquement en facture de location — ce sont deux documents totalement indépendants.",
      ],
      rolesRequis: ["DG ou responsable du parc"],
    },
  ],
};
