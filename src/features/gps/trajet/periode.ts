/**
 * Période du trajet affiché (2026-09-30) — logique pure. Bornes en heure
 * locale « AAAA-MM-JJTHH:mm:ss » (le serveur lit des LocalDateTime).
 */
export type ChoixPeriode = "AUJOURDHUI" | "HIER" | "SEPT_JOURS" | "PERSO";

export const LIBELLES_PERIODE: Record<ChoixPeriode, string> = {
  AUJOURDHUI: "Aujourd'hui",
  HIER: "Hier",
  SEPT_JOURS: "7 derniers jours",
  PERSO: "Dates au choix",
};

export const JOURS_MAX = 31;

export interface Bornes {
  debut: string;
  fin: string;
}

const deux = (n: number) => String(n).padStart(2, "0");

/** « 2026-09-30 » en heure locale. */
export function jourLocal(d: Date): string {
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

function decaler(d: Date, jours: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + jours);
  return r;
}

/** Bornes de la période, ou un message si les dates choisies ne conviennent pas. */
export function bornesPeriode(
  choix: ChoixPeriode,
  maintenant: Date,
  perso?: { debut: string; fin: string },
): Bornes | { erreur: string } {
  const du = (jour: string) => `${jour}T00:00:00`;
  const au = (jour: string) => `${jour}T23:59:59`;
  const aujourdhui = jourLocal(maintenant);
  switch (choix) {
    case "AUJOURDHUI":
      return { debut: du(aujourdhui), fin: au(aujourdhui) };
    case "HIER": {
      const hier = jourLocal(decaler(maintenant, -1));
      return { debut: du(hier), fin: au(hier) };
    }
    case "SEPT_JOURS":
      return { debut: du(jourLocal(decaler(maintenant, -6))), fin: au(aujourdhui) };
    case "PERSO": {
      if (!perso?.debut || !perso?.fin) return { erreur: "Choisissez les deux dates" };
      if (perso.fin < perso.debut) return { erreur: "La date de fin doit suivre la date de début" };
      const jours = Math.round((Date.parse(perso.fin) - Date.parse(perso.debut)) / 86_400_000) + 1;
      if (jours > JOURS_MAX) return { erreur: `${JOURS_MAX} jours au plus` };
      return { debut: du(perso.debut), fin: au(perso.fin) };
    }
  }
}

export function estErreur(b: Bornes | { erreur: string }): b is { erreur: string } {
  return "erreur" in b;
}

/** « moins d'1 min », « 12 min », « 2 h 05 », « 1 j 3 h ». */
export function formatDuree(minutes: number): string {
  if (minutes < 1) return "moins d'1 min";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ${deux(minutes % 60)}`;
  const jours = Math.floor(minutes / (24 * 60));
  const heures = Math.floor((minutes % (24 * 60)) / 60);
  return heures ? `${jours} j ${heures} h` : `${jours} j`;
}

/** Temps total passé sur chaque chantier pendant la période, du plus long au plus court. */
export function totauxParChantier(
  passages: readonly { idChantier: number; nomChantier: string; dureeMinutes: number }[],
): { idChantier: number; nomChantier: string; minutes: number; passages: number }[] {
  const parChantier = new Map<number, { idChantier: number; nomChantier: string; minutes: number; passages: number }>();
  for (const p of passages) {
    const t = parChantier.get(p.idChantier) ?? { idChantier: p.idChantier, nomChantier: p.nomChantier, minutes: 0, passages: 0 };
    t.minutes += p.dureeMinutes;
    t.passages += 1;
    parChantier.set(p.idChantier, t);
  }
  return [...parChantier.values()].sort((a, b) => b.minutes - a.minutes);
}
