import type { SchemaAide } from "@/types/aide";

/**
 * Schémas de l'aide (étape 5) : là où le texte seul est ambigu — cycles de
 * vie, circuits, notions. Rendus en HTML par SchemaAide.tsx (thème clair ou
 * sombre, lisible au lecteur d'écran), pas en image.
 */
export const SCHEMAS: SchemaAide[] = [
  {
    id: "cycle-mission",
    titre: "Cycle de vie d'une mission",
    forme: "CHAINE",
    etapes: [
      { libelle: "Planifiée", note: "Nouvelle mission" },
      { libelle: "En cours", ton: "NEUTRE", note: "Démarrer + km au départ" },
      { libelle: "Terminée", ton: "POSITIF", note: "Terminer + km au retour" },
    ],
    sorties: [{ depuis: "Planifiée ou En cours", vers: "Annulée", note: "Annuler, avec un motif obligatoire" }],
  },
  {
    id: "statuts-vehicule",
    titre: "Statuts d'un véhicule",
    forme: "ETATS",
    etapes: [
      { libelle: "Disponible", ton: "POSITIF", note: "Peut partir en mission" },
      { libelle: "Affecté", note: "Attribué à un conducteur" },
      { libelle: "En mission", ton: "NEUTRE", note: "Mission démarrée" },
      { libelle: "En maintenance", ton: "ATTENTION", note: "Maintenance en cours" },
      { libelle: "En panne", ton: "CRITIQUE", note: "Ne peut pas rouler" },
      { libelle: "Réformé / Vendu", note: "Sorti du parc" },
    ],
    legende: "Les mêmes couleurs sont utilisées sur la carte GPS.",
  },
  {
    id: "circuit-maintenance",
    titre: "Circuit d'une maintenance",
    forme: "CHAINE",
    etapes: [
      { libelle: "Planifiée", note: "Avec ou sans date prévue" },
      { libelle: "En cours", ton: "ATTENTION", note: "Véhicule immobilisé" },
      { libelle: "Terminée", ton: "POSITIF", note: "Coût figé, proforma si garage" },
    ],
    sorties: [{ depuis: "Planifiée", vers: "Planifiée", note: "Replanifier : nouvelle date, ou date retirée" }],
  },
  {
    id: "escalade-alertes",
    titre: "Montée d'une alerte non traitée",
    forme: "CHAINE",
    etapes: [
      { libelle: "Faible", note: "Moyenne après 7 jours" },
      { libelle: "Moyenne", ton: "NEUTRE", note: "Élevée après 3 jours" },
      { libelle: "Élevée", ton: "ATTENTION", note: "Critique après 2 jours" },
      { libelle: "Critique", ton: "CRITIQUE", note: "Notification immédiate" },
    ],
    legende: "Délais par défaut, réglables dans Paramètres. Une alerte traitée ne monte plus.",
  },
  {
    id: "plein-a-plein",
    titre: "Calcul de la consommation",
    forme: "CHAINE",
    etapes: [
      { libelle: "Plein complet", ton: "POSITIF", note: "Point de départ" },
      { libelle: "Appoints, bidons", note: "Litres ajoutés au total" },
      { libelle: "Plein complet", ton: "POSITIF", note: "Consommation L/100 km calculée" },
    ],
    legende: "Chaque saisie est aussi comparée à la consommation de référence du véhicule.",
  },
  {
    id: "barre-navigation",
    titre: "La barre de navigation, de gauche à droite",
    forme: "CHAINE",
    etapes: [
      { libelle: "Tableau de bord" },
      { libelle: "Pilotage" },
      { libelle: "Parc" },
      { libelle: "Exploitation" },
      { libelle: "Atelier" },
      { libelle: "Finances" },
      { libelle: "Administration" },
      { libelle: "★ Favoris" },
      { libelle: "Messagerie" },
      { libelle: "Loupe (Ctrl+K)" },
      { libelle: "?" },
      { libelle: "Thème" },
      { libelle: "Avatar" },
    ],
  },
];

export function schemaParId(id: string | undefined): SchemaAide | undefined {
  return id ? SCHEMAS.find((s) => s.id === id) : undefined;
}
