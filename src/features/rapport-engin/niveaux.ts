/**
 * Rapport du véhicule (2026-09-24) — niveaux de gravité et agrégation.
 * Logique pure, sans React ni appel réseau : réutilisable ailleurs (pastille
 * d'état dans la liste des engins, tableau de bord...) et testable seule.
 *
 * Code couleur demandé par l'utilisateur : vert = OK, jaune = avertissement,
 * rouge = alerte ; gris = rien de renseigné (donnée manquante, ce n'est ni
 * un bon ni un mauvais signal).
 */
export type NiveauRapport = "ok" | "inconnu" | "avertissement" | "alerte";

/**
 * Ordre de gravité. « inconnu » passe AVANT « ok » dans la gravité : une
 * rubrique à moitié contrôlée ne doit pas s'afficher en vert.
 */
const GRAVITE: Record<NiveauRapport, number> = {
  ok: 0,
  inconnu: 1,
  avertissement: 2,
  alerte: 3,
};

export function comparerGravite(a: NiveauRapport, b: NiveauRapport): number {
  return GRAVITE[a] - GRAVITE[b];
}

/** Niveau le plus grave d'une liste ; `siVide` quand la liste est vide. */
export function niveauLePlusGrave(niveaux: NiveauRapport[], siVide: NiveauRapport = "inconnu"): NiveauRapport {
  if (niveaux.length === 0) return siVide;
  return niveaux.reduce((pire, n) => (GRAVITE[n] > GRAVITE[pire] ? n : pire));
}

/** Famille d'un bloc : détermine son pictogramme (voir presentation.ts). */
export type FamilleBloc =
  | "alertes"
  | "documents"
  | "equipements"
  | "entretien"
  | "emplacement"
  | "conducteur"
  | "carburant"
  | "incidents";

export interface LigneRapport {
  cle: string;
  libelle: string;
  niveau: NiveauRapport;
  /** Explication courte : « Expire le 12/10/2026 (dans 18 j) », « Absent »... */
  detail: string;
}

export interface BlocRapport {
  cle: string;
  famille: FamilleBloc;
  titre: string;
  niveau: NiveauRapport;
  /** Une phrase de synthèse affichée sous le titre. */
  resume: string;
  lignes: LigneRapport[];
  /** Remarque secondaire (ex. documents facultatifs non enregistrés). */
  note?: string;
  /** Vrai si la source n'a pas pu être chargée (droits, réseau) : bloc gris. */
  indisponible?: boolean;
}

export type SyntheseRapport = Record<NiveauRapport, number>;

/** Nombre de points contrôlés par niveau, toutes rubriques confondues. */
export function syntheseRapport(blocs: BlocRapport[]): SyntheseRapport {
  const synthese: SyntheseRapport = { ok: 0, inconnu: 0, avertissement: 0, alerte: 0 };
  for (const bloc of blocs) {
    for (const ligne of bloc.lignes) synthese[ligne.niveau] += 1;
  }
  return synthese;
}

/** Lignes triées de la plus grave à la moins grave (ordre d'origine conservé à gravité égale). */
export function trierParGravite(lignes: LigneRapport[]): LigneRapport[] {
  return [...lignes].sort((a, b) => comparerGravite(b.niveau, a.niveau));
}
