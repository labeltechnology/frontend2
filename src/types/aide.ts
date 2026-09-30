import type { Capacite } from "@/lib/droits";

/**
 * Aide en ligne (refonte du 2026-09-28, d'après la méthode « Créer l'aide en
 * ligne de mon logiciel »). Types uniquement : le contenu vit dans
 * features/aide/contenu/, un fichier par rubrique ou par module.
 *
 * Arborescence (étape 3, 3 niveaux au plus) :
 *   Centre d'aide → rubrique (5) → section (module ou thème, 7 au plus) → page.
 */

/** Les cinq rubriques, classées par ce que l'utilisateur veut faire. */
export type IdRubriqueAide = "demarrer" | "guides" | "faq" | "depannage" | "contact";

/** Fréquence et priorité d'une tâche (étape 2 : inventaire des parcours). */
export type FrequenceTache = "QUOTIDIENNE" | "HEBDOMADAIRE" | "MENSUELLE" | "OCCASIONNELLE";
export type PrioriteTache = "HAUTE" | "MOYENNE" | "BASSE";

/** Emplacement d'une capture d'écran (étape 5) : fichier à déposer dans public/aide/captures/. */
export interface CaptureAide {
  /** Nom lisible, ex. « vehicules-nouveau-vehicule-01.png ». */
  fichier: string;
  /** Texte alternatif, obligatoire. */
  alt: string;
  legende?: string;
}

/** Champs communs à toutes les pages. */
interface BasePageAide {
  /** Identifiant stable (minuscules, chiffres, tirets) : ancre, lien, votes. */
  id: string;
  /** Titre : pour un guide, commence par un verbe d'action (« Planifier une mission »). */
  titre: string;
  /** Une phrase : affichée dans les listes et la recherche. */
  resume: string;
  /** Date de dernière révision (AAAA-MM-JJ). */
  revision: string;
  /** Mots que l'utilisateur taperait dans la recherche (synonymes). */
  motsCles?: string[];
  /** Écrans concernés (chemins, « :id » accepté) : aide contextuelle du bouton « ? ». */
  ecrans?: string[];
  /** Identifiants d'autres pages. */
  voirAussi?: string[];
  /** Capacité nécessaire pour faire la tâche ; absente = tout utilisateur. */
  capacite?: Capacite;
}

/** Page « Guide par tâche » (étape 4, modèle fixe). */
export interface PageGuide extends BasePageAide {
  type: "GUIDE";
  objectif: string;
  avantDeCommencer?: string[];
  /** Une action par étape, à l'impératif ; **texte** = nom exact d'un bouton ou d'un menu. */
  etapes: string[];
  resultat: string;
  bonASavoir?: string[];
  schema?: string;
  captures?: CaptureAide[];
  frequence: FrequenceTache;
  priorite: PrioriteTache;
}

export interface SectionTexteAide {
  titre: string;
  paragraphes?: string[];
  liste?: string[];
  tableau?: { colonnes: string[]; lignes: string[][] };
}

/** Page descriptive (Démarrer, Contact) : sections de texte, schéma, captures. */
export interface PageTexte extends BasePageAide {
  type: "TEXTE";
  sections: SectionTexteAide[];
  schema?: string;
  captures?: CaptureAide[];
}

/** Question de la FAQ : réponse de 2 à 4 lignes. */
export interface PageFaq extends BasePageAide {
  type: "FAQ";
  reponse: string;
}

/** Entrée de dépannage (étape 4) : symptôme, cause, solution, et si le problème continue. */
export interface PageDepannage extends BasePageAide {
  type: "DEPANNAGE";
  /** Ce que l'utilisateur voit. */
  symptome: string;
  /** Texte exact du message d'erreur, s'il y en a un. */
  message?: string;
  cause: string;
  solution: string[];
}

/** Règles d'un module (ancien manuel, gardé comme référence dans « Guides par tâche »). */
export interface PageReference extends BasePageAide {
  type: "REFERENCE";
  articles: ArticleAide[];
}

/** Journal des versions (rubrique Contact et nouveautés). */
export interface PageNouveautes extends BasePageAide {
  type: "NOUVEAUTES";
  versions: { date: string; titre: string; points: string[] }[];
}

/** Suivi de l'aide : votes et recherches sans résultat (administrateur). */
export interface PageSuivi extends BasePageAide {
  type: "SUIVI";
}

export type PageAide = PageGuide | PageTexte | PageFaq | PageDepannage | PageReference | PageNouveautes | PageSuivi;

/** Niveau 2 : un module (Guides par tâche) ou un thème (FAQ, Dépannage). */
export interface SectionAide {
  id: string;
  titre: string;
  description?: string;
  /** Nom d'icône (voir features/aide/icones-aide.ts). */
  icone?: string;
  pages: PageAide[];
}

/** Niveau 1 : une rubrique ; ses pages sont soit directes, soit rangées en sections. */
export interface RubriqueAide {
  id: IdRubriqueAide;
  titre: string;
  description: string;
  icone: string;
  pages: PageAide[];
  sections: SectionAide[];
}

/** Schéma (étape 5) : une chaîne d'étapes avec flèches, ou des états sans ordre. */
export interface SchemaAide {
  id: string;
  titre: string;
  forme: "CHAINE" | "ETATS";
  etapes: { libelle: string; ton?: "NEUTRE" | "POSITIF" | "ATTENTION" | "CRITIQUE"; note?: string; lien?: string }[];
  /** Transitions hors de la chaîne (ex. « Annulée » depuis Planifiée ou En cours). */
  sorties?: { depuis: string; vers: string; note: string }[];
  legende?: string;
}

// --- Ancien manuel par module (2026-09-21), repris en pages « Règles à connaître » ---

/** Un point d'aide sur un module précis de l'application (ex. "Véhicules", "Missions"). */
export interface ArticleAide {
  id: string;
  titre: string;
  resume: string;
  fonctionnalites: string[];
  reglesCles: string[];
  astuces?: string[];
  rolesRequis?: string[];
}

/** Un groupe thématique de l'ancien manuel. */
export interface GroupeAide {
  id: string;
  titre: string;
  icone: string;
  articles: ArticleAide[];
}
