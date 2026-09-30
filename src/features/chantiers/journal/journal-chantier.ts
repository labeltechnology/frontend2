import type { AffectationChantier, Chantier, JournalChantier, Meteo } from "@/types/chantier";

/**
 * Journal de chantier (2026-09-29) — logique pure, mêmes règles que
 * ReglesJournalChantier côté serveur (qui reste l'arbitre).
 * Dates au format AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique.
 */

export const LIBELLES_METEO: Record<Meteo, string> = {
  ENSOLEILLE: "Ensoleillé",
  NUAGEUX: "Nuageux",
  PLUIE: "Pluie",
  ORAGE: "Orage",
  VENT_FORT: "Vent fort",
  CYCLONE: "Cyclone",
};

export const JOURS_APRES_FIN = 7;
export const MAX_PHOTOS = 10;

function decaler(dateIso: string, jours: number): string {
  const [a, m, j] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j + jours)).toISOString().slice(0, 10);
}

/** Motif de refus d'écriture selon le statut du chantier ; null si permis. */
export function refusEcriture(chantier: Pick<Chantier, "statut" | "dateFinPrevue">, aujourdhui: string): string | null {
  switch (chantier.statut) {
    case "EN_COURS":
      return null;
    case "TERMINE":
      return aujourdhui <= decaler(chantier.dateFinPrevue, JOURS_APRES_FIN)
        ? null
        : `Chantier terminé depuis plus de ${JOURS_APRES_FIN} jours : le journal est clos.`;
    case "PLANIFIE":
      return "Le journal se remplit une fois le chantier démarré.";
    default:
      return "Chantier annulé : pas de journal.";
  }
}

/** Journée proposée : aujourd'hui (borné aux dates du chantier), sinon le dernier jour sans journal. */
export function journeeParDefaut(
  chantier: Pick<Chantier, "dateDebutPrevue" | "dateFinPrevue">,
  journaux: Pick<JournalChantier, "dateJour">[],
  aujourdhui: string,
): string | null {
  const faits = new Set(journaux.map((j) => j.dateJour));
  let jour = aujourdhui < chantier.dateFinPrevue ? aujourdhui : chantier.dateFinPrevue;
  while (jour >= chantier.dateDebutPrevue) {
    if (!faits.has(jour)) return jour;
    jour = decaler(jour, -1);
  }
  return null;
}

/** Motif de refus de la journée ; null si elle convient. */
export function refusJournee(
  jour: string,
  chantier: Pick<Chantier, "dateDebutPrevue" | "dateFinPrevue">,
  journaux: Pick<JournalChantier, "dateJour" | "idJournal">[],
  aujourdhui: string,
  idJournalEdite?: number,
): string | null {
  if (!jour) return "Indiquez la date de la journée.";
  if (jour > aujourdhui) return "Le journal ne se remplit pas à l'avance.";
  if (jour < chantier.dateDebutPrevue || jour > chantier.dateFinPrevue) return "Journée en dehors des dates du chantier.";
  if (journaux.some((j) => j.dateJour === jour && j.idJournal !== idJournalEdite)) return "Cette journée est déjà rédigée : modifiez-la.";
  return null;
}

/**
 * Véhicules prévus sur le chantier ce jour-là : rattachement non annulé dont
 * la période couvre le jour et, s'il a été retiré, pas après le jour du retrait.
 */
export function vehiculesDuJour(affectations: AffectationChantier[], jour: string): AffectationChantier[] {
  return affectations.filter((a) => {
    if (a.statut === "ANNULEE" || jour < a.dateDebutPrevue || jour > a.dateFinPrevue) return false;
    return a.statut !== "TERMINEE" || !a.dateFin || jour <= a.dateFin.slice(0, 10);
  });
}

/** Heures saisies (texte, virgule acceptée) : nombre de 0 à 24, null si vide ; NaN si invalide. */
export function lireHeures(texte: string): number | null {
  const propre = texte.trim().replace(",", ".");
  if (!propre) return null;
  const n = Number(propre);
  return Number.isFinite(n) && n >= 0 && n <= 24 ? n : Number.NaN;
}

/** « 8 h », « 7,5 h ». */
export function formatHeures(heures: number): string {
  return `${heures.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`;
}

/** Date locale au format AAAA-MM-JJ (pas toISOString, qui passe en UTC). */
export function jourLocal(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const j = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${j}`;
}
