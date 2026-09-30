import type { GroupeAide } from "@/types/aide";

/**
 * Rapports : génération de synthèses chiffrées, avec aperçu obligatoire
 * avant tout export PDF ou Excel.
 */
export const groupeRapports: GroupeAide = {
  id: "rapports",
  titre: "Rapports",
  icone: "FileBarChart",
  articles: [
    {
      id: "rapports",
      titre: "Rapports",
      resume:
        "Synthèses chiffrées du parc (activité, coûts, incidents, documents, trésorerie…), consultables à l'écran et téléchargeables en PDF ou Excel.",
      fonctionnalites: [
        "Choisir le rapport dans un catalogue en cartes (Synthèses, Activité, Finances, Parc et conformité)",
        "Période en un clic (Ce mois, Mois dernier, 30 derniers jours…) et cible (véhicule, conducteur, chantier) selon le type",
        "Aperçu lisible : chiffres clés colorés, répartitions en barres, listes",
        "Télécharger en PDF ou en Excel, régénérer avec les mêmes paramètres",
        "Liste filtrable : recherche, famille, date de génération",
      ],
      reglesCles: [
        "Quatorze types de rapport ; certains exigent un véhicule (synthèse par véhicule, rentabilité), un conducteur ou un chantier.",
        "La synthèse générale et le taux d'utilisation exigent une période complète ; parc, trésorerie et documents montrent la situation du jour.",
        "L'aperçu, le PDF et l'Excel ont exactement le même contenu.",
        "Un rapport n'est jamais modifié après sa génération ; « Régénérer » en crée un nouveau.",
      ],
      rolesRequis: ["Tous les profils sauf le conducteur"],
    },
  ],
};
