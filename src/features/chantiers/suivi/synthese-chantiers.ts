import type { ChantierResume, EtatSuiviChantier } from "@/types/chantier";

/**
 * Liste enrichie des chantiers (2026-09-29) — logique pure : libellés de
 * l'état du jour, indicateurs du haut de page, recherche et filtres. L'état
 * est calculé par le serveur (SuiviChantier.etat).
 */

export const LIBELLES_ETAT: Record<EtatSuiviChantier, string> = {
  A_VENIR: "À venir",
  NON_DEMARRE: "Non démarré",
  DANS_LES_TEMPS: "Dans les temps",
  EN_RETARD: "En retard",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const VARIANT_ETAT: Record<EtatSuiviChantier, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  A_VENIR: "default",
  NON_DEMARRE: "warning",
  DANS_LES_TEMPS: "success",
  EN_RETARD: "destructive",
  TERMINE: "outline",
  ANNULE: "outline",
};

/** Filtres de la liste : « actifs » = ni terminé ni annulé ; « en cours » = démarré (dans les temps ou en retard). */
export type FiltreChantiers = "ACTIFS" | "EN_COURS" | "A_SURVEILLER" | "TOUS" | EtatSuiviChantier;

export const LIBELLES_FILTRE: Record<FiltreChantiers, string> = {
  ACTIFS: "En cours et à venir",
  EN_COURS: "En cours",
  A_SURVEILLER: "À surveiller",
  TOUS: "Tous",
  ...LIBELLES_ETAT,
};

/** Non démarré à la date prévue, en retard ou avec une alerte ouverte. */
export function aSurveiller(r: ChantierResume): boolean {
  return r.etat === "NON_DEMARRE" || r.etat === "EN_RETARD" || r.alertesOuvertes > 0;
}

export interface IndicateursChantiers {
  enCours: number;
  aVenir: number;
  nonDemarres: number;
  enRetard: number;
  alertesOuvertes: number;
}

export function indicateurs(resumes: ChantierResume[]): IndicateursChantiers {
  const compte = (etat: EtatSuiviChantier) => resumes.filter((r) => r.etat === etat).length;
  return {
    enCours: resumes.filter((r) => r.chantier.statut === "EN_COURS").length,
    aVenir: compte("A_VENIR"),
    nonDemarres: compte("NON_DEMARRE"),
    enRetard: compte("EN_RETARD"),
    alertesOuvertes: resumes.reduce((s, r) => s + r.alertesOuvertes, 0),
  };
}

function correspondFiltre(r: ChantierResume, filtre: FiltreChantiers): boolean {
  switch (filtre) {
    case "TOUS":
      return true;
    case "ACTIFS":
      return r.etat !== "TERMINE" && r.etat !== "ANNULE";
    case "EN_COURS":
      return r.chantier.statut === "EN_COURS";
    case "A_SURVEILLER":
      return aSurveiller(r);
    default:
      return r.etat === filtre;
  }
}

/** Recherche sans casse ni accents sur le nom, le lieu et la description. */
export function filtrerChantiers(resumes: ChantierResume[], recherche: string, filtre: FiltreChantiers): ChantierResume[] {
  const terme = sansAccents(recherche.trim());
  return resumes.filter(
    (r) =>
      correspondFiltre(r, filtre) &&
      (!terme ||
        [r.chantier.nom, r.chantier.lieu, r.chantier.description]
          .filter((v): v is string => Boolean(v))
          .some((v) => sansAccents(v).includes(terme))),
  );
}

function sansAccents(v: string): string {
  return v.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");
}

/** « 5 j restants », « Dernier jour », « 3 j de retard » ; « — » pour un chantier clos. */
export function libelleJoursRestants(joursRestants: number | null): string {
  if (joursRestants === null) return "—";
  if (joursRestants === 0) return "Dernier jour";
  if (joursRestants > 0) return `${joursRestants} j restant${joursRestants > 1 ? "s" : ""}`;
  return `${-joursRestants} j de retard`;
}

export const MOTIF_ANNULATION_MAX = 255;

/** Message d'erreur du motif d'annulation, `null` s'il est valide (même règle que Chantier.annuler côté serveur). */
export function problemeMotifAnnulation(motif: string): string | null {
  const texte = motif.trim();
  if (!texte) return "Indiquez le motif de l'annulation.";
  if (texte.length > MOTIF_ANNULATION_MAX) return `${MOTIF_ANNULATION_MAX} caractères maximum.`;
  return null;
}
