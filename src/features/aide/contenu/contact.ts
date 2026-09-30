import type { PageNouveautes, PageSuivi, PageTexte } from "@/types/aide";
import { REVISION_INITIALE } from "@/features/aide/contenu/revision";

/**
 * Rubrique « Contact et nouveautés ». Les coordonnées du support se règlent
 * ici (CONTACT_SUPPORT) : laisser null ce qui n'existe pas.
 */
export const CONTACT_SUPPORT: { responsable: string; telephone: string | null; email: string | null } = {
  /** Responsable de l'aide (étape 1) : valide le contenu et le met à jour à chaque version. */
  responsable: "Administrateur (informatique)",
  telephone: null,
  email: null,
};

export const pageContact: PageTexte = {
  type: "TEXTE",
  id: "contact-support",
  titre: "Contacter le support",
  resume: "Qui prévenir et comment, quand l'aide ne suffit pas.",
  revision: REVISION_INITIALE,
  motsCles: ["support", "contact", "aide", "assistance", "problème", "bug", "signaler"],
  sections: [
    {
      titre: "Par la messagerie de l'application",
      liste: [
        "Cliquez sur **Messagerie**, puis sur **Nouveau message**.",
        "Tapez « Administrateur » pour trouver l'administrateur, puis écrivez votre message.",
        "Décrivez l'écran, ce que vous avez fait et le message d'erreur exact ; joignez une capture si possible.",
      ],
    },
    {
      titre: "Pour une urgence sur la route",
      paragraphes: [
        "Un véhicule en panne ou accidenté : prévenez d'abord le responsable du parc par téléphone.",
        "Déclarez ensuite l'incident dans l'application.",
      ],
    },
    {
      titre: "Signaler une page d'aide à améliorer",
      paragraphes: ["En bas de chaque page, répondez à « Cet article vous a-t-il aidé ? ». Un « Non » avec un commentaire nous aide à la réécrire."],
    },
  ],
  voirAussi: ["guide-envoyer-message", "guide-declarer-incident"],
};

export const pageNouveautes: PageNouveautes = {
  type: "NOUVEAUTES",
  id: "nouveautes",
  titre: "Voir les nouveautés",
  resume: "Le journal des versions : ce qui a changé dans l'application.",
  revision: REVISION_INITIALE,
  motsCles: ["nouveauté", "version", "changement", "mise à jour", "journal"],
  versions: [
    {
      date: "2026-09-30",
      titre: "Chacun voit les pages de son métier",
      points: [
        "Le **DG**, le **responsable du parc** et l'**administrateur** voient toutes les pages et ont tous les droits.",
        "Le **chef de maintenance** voit l'atelier : maintenances, pièces, garages, fournisseurs, véhicules, incidents, fiabilité et les alertes de l'atelier. L'**assistant maintenance** voit la même chose, sans la fiabilité, en lecture.",
        "Le **comptable** voit les finances : coûts, renouvellement, rapports, carburant, maintenance, garages et fournisseurs, locations, prestataires, proformas et export comptable.",
        "Le **chef de chantier** voit ses chantiers, leurs affectations, leurs véhicules sur la carte GPS, leurs incidents et leurs alertes.",
        "L'**assistant du parc** voit le parc et l'exploitation : véhicules, documents, conducteurs, zones, missions, affectations, chantiers, GPS, carburant, incidents, alertes et rapports.",
        "Le **conducteur** n'a sur le site que la **Messagerie** et l'**Aide** ; tout le reste se fait dans l'application mobile.",
        "Nouveaux **tableaux de bord par métier** : atelier (planning, retards, pièces à réapprovisionner), finances (factures à régler et à encaisser, contrats à échéance, dépenses du mois) et chef de chantier (véhicules sur place, demandes de matériel).",
        "Le serveur applique les mêmes règles : une page ou une donnée hors de votre métier est refusée, même par un lien direct.",
      ],
    },
    {
      date: "2026-09-30",
      titre: "Chantiers sur la carte GPS et trajets par période",
      points: [
        "Carte **GPS & trajets** : les chantiers en cours et planifiés apparaissent (casque de chantier), avec leur périmètre de présence et, au choix, leur plan.",
        "La bulle d'un véhicule indique son chantier du jour et s'il est sur place ou hors du chantier ; la bulle d'un chantier liste ses véhicules.",
        "Trajet d'un véhicule sur une période (aujourd'hui, hier, 7 jours ou dates au choix) avec distance, vitesse maximale et passages sur chantier (entrée, sortie, durée).",
      ],
    },
    {
      date: "2026-09-30",
      titre: "Alertes closes automatiquement",
      points: [
        "Une alerte se ferme seule quand sa cause disparaît : document renouvelé, entretien fait ou planifié, stock réapprovisionné, sortie ou retour de chantier saisi, chantier démarré ou terminé, demande de matériel traitée.",
        "Son statut indique « Close auto » avec le motif ; le journal d'audit garde la trace.",
        "Bouton **Vérifier les causes** sur la page **Alertes** : le contrôle se fait tout de suite, sans attendre les 15 minutes.",
        "Un document expiré ne crée plus une nouvelle alerte toutes les 6 heures : une seule, tant qu'elle est ouverte.",
      ],
    },
    {
      date: "2026-09-30",
      titre: "Ergonomie : trouver et saisir plus vite",
      points: [
        "Menu rangé par métier : **Pilotage**, **Parc**, **Exploitation**, **Atelier**, **Finances**, **Administration**.",
        "**Favoris** : l'étoile à côté du titre d'une page la place dans le menu ★, avec vos pages récentes.",
        "La loupe (**Ctrl+K**) trouve aussi un véhicule par son immatriculation, une mission, un chantier, un conducteur, et propose des actions : **Ajouter un plein**, **Déclarer un incident**…",
        "Listes : tri en cliquant sur un titre de colonne, filtres par statut, recherche, pages de 25 lignes ; vos réglages sont gardés d'une visite à l'autre. Sur téléphone, une carte par ligne.",
        "Fil d'Ariane et bouton de retour en haut des pages ; une fiche modifiée prévient avant de la quitter sans enregistrer.",
        "Raccourcis clavier : touche **?** pour la liste ; **N** nouveau, **/** chercher dans la liste, **Ctrl+S** enregistrer, **G** puis **V** pour aller aux véhicules.",
        "Nouvelle page **Mise en service** (Administration) : les réglages à faire, étape par étape, avec l'avancement.",
      ],
    },
    {
      date: "2026-09-29",
      titre: "Sécurité, qualité des données et intégrations",
      points: [
        "Connexion : blocage de 15 minutes après 5 mots de passe erronés ; journal des connexions (onglet **Connexions** du Suivi du logiciel).",
        "Mots de passe : 12 caractères au moins ; **Changer mon mot de passe** dans votre menu ; réinitialisation par l'administration.",
        "Pleins : refus au-delà du réservoir et des doublons ; confirmation demandée pour une distance impossible.",
        "Nouvelle page **Suivi du logiciel** : adoption par rôle, qualité des données, connexions.",
        "Nouvelles pages **Recommandations** et **Import Excel / CSV** ; bouton **Excel** sur le graphe de l'analytique ; webhooks des alertes critiques.",
      ],
    },
    {
      date: "2026-09-29",
      titre: "Données et reporting",
      points: [
        "Page **Rapports** : bouton **Recevoir par e-mail** pour recevoir des rapports PDF chaque semaine ou chaque mois.",
        "**Paramètres** : jour et heure des envois, e-mail d'essai et historique de tous les envois.",
        "Page **Coûts** : nouvel onglet **Prévisions** (tendance sur 24 mois, moyenne sur 3 mois, projection sur 12 mois, budget carburant).",
        "Nouvelle page **Export comptable** (menu Finances) : écritures CSV des factures, du carburant et de la maintenance.",
        "**Paramètres** : journaux, comptes et séparateur de l'export comptable.",
      ],
    },
    {
      date: "2026-09-29",
      titre: "Fiabilité, conformité et renouvellement",
      points: [
        "Nouvelle page **Fiabilité et conformité** (menu Pilotage) : disponibilité, pannes, coût des immobilisations, délai de réparation par garage, entretiens en retard.",
        "Clôture d'une maintenance : contrôle qualité (qui a contrôlé, essai concluant, réserve).",
        "Conformité des véhicules et des conducteurs ; documents obligatoires par type ; permis ou CACES exigé au démarrage d'une mission.",
        "Fatigue au volant : alerte au-delà de 4 h 30 sans pause ou 9 h par jour (réglable dans Paramètres).",
        "Incidents : volet **Sinistre** (assureur, franchise, indemnisation, reste à charge).",
        "Nouvelle page **Renouvellement** : plan par année, besoins futurs, fin de vie et plus ou moins-values.",
        "Trois nouveaux rapports PDF : fiabilité et conformité, sinistralité, renouvellement.",
      ],
    },
    {
      date: "2026-09-29",
      titre: "Coûts et rentabilité",
      points: [
        "Nouvelle page **Coûts** (menu Pilotage) : coût complet (TCO) de chaque véhicule, par type et par poste.",
        "Fiche véhicule : rubrique **Coûts** (achat ou location, amortissement, assurance, taxes, vignette).",
        "Véhicules « à surveiller » ou « à remplacer » : coût de maintenance au km, pannes, âge, compteur ; seuils dans Paramètres.",
        "Budget carburant annuel par type, réparti par mois, écart expliqué et projection de fin d'année.",
        "Score de conduite mensuel par conducteur : survitesses et manœuvres brusques (Traccar).",
        "Nouveau rapport PDF **Coûts et rentabilité (TCO)**.",
      ],
    },
    {
      date: "2026-09-28",
      titre: "Performance et utilisation du parc",
      points: [
        "Nouvelle page **Performance** (menu Pilotage) : taux d'utilisation réel, véhicules sous-utilisés ou en trop.",
        "Coût par km (véhicules routiers) et par heure (engins), comparé au coût de référence du type.",
        "Fiche **KPI du parc** : définition, formule, fréquence et objectif réglable de chaque indicateur.",
        "Types de véhicule : seuils de sous-utilisation et coût de référence.",
        "Compteur horaire des engins saisi au plein et au démarrage / à la fin d'une mission.",
        "Nouveau rapport PDF **Performance et utilisation**.",
      ],
    },
    {
      date: "2026-09-28",
      titre: "Rapports, maintenance, alertes et aide en ligne",
      points: [
        "Nouvelle aide en ligne : guides par tâche, FAQ, dépannage, bouton **?** sur chaque page.",
        "Page Rapports refaite : choix du rapport en cartes, aperçu lisible, PDF avec graphiques.",
        "Rapport d'un véhicule : carte **Localisation** avec la position GPS et le trajet des 24 dernières heures.",
        "Maintenance : formulaire unique, date prévue, bouton **Replanifier**, fiche détaillée.",
        "Alertes : montée automatique de la priorité des alertes non traitées ; alertes répétées regroupées.",
        "Carburant : plein complet, appoint ou bidon ; contrôle de la consommation à chaque saisie.",
        "Messagerie interne entre collègues, avec pièces jointes.",
        "Huit rôles avec des droits précis.",
      ],
    },
    {
      date: "2026-09-25",
      titre: "Navigation et rapport d'un véhicule",
      points: [
        "Barre de navigation flottante en bas de l'écran, avec recherche de page (Ctrl+K).",
        "Rapport d'un véhicule en infographie, avec historique par carte.",
        "Le code interne des véhicules n'est plus affiché : on les reconnaît par leur immatriculation.",
      ],
    },
  ],
};

export const pageSuivi: PageSuivi = {
  type: "SUIVI",
  id: "suivi-aide",
  titre: "Suivre et améliorer l'aide",
  resume: "Votes, recherches sans résultat, pages à relire et tests (administrateurs).",
  revision: REVISION_INITIALE,
  capacite: "ADMINISTRER",
  motsCles: ["statistiques", "votes", "maintenance de l'aide"],
};

/** Étape 7 : protocole de test par trois personnes qui ne connaissent pas le logiciel. */
export const SCENARIOS_TEST = [
  "Planifiez une mission pour demain, puis démarrez-la.",
  "Enregistrez un appoint de 20 litres sur un véhicule.",
  "Trouvez où se trouve un véhicule en ce moment.",
  "Créez une maintenance planifiée, puis décalez-la d'une semaine.",
  "Générez la synthèse générale du mois et téléchargez le PDF.",
];

/** Étape 7 : habitudes qui gardent l'aide fiable. */
export const HABITUDES_MAINTENANCE = [
  "À chaque version : relire les pages liées aux écrans modifiés et changer leur date de révision.",
  "Chaque mois : lire les votes « Non » et les recherches sans résultat, puis créer ou réécrire les pages.",
  "Ajouter à la FAQ les questions reçues par message ou par téléphone.",
  "Ajouter les captures manquantes depuis un compte de démonstration, avec des données fictives.",
];

/** Au-delà, une page est signalée « à relire » dans le suivi. */
export const JOURS_AVANT_RELECTURE = 180;
