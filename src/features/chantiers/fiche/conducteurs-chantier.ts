import type { Conducteur } from "@/types/conducteur";
import type { ConducteurCandidatChantier, ConducteurFicheRequest, OccupationChantier } from "@/types/chantier";
import { formatDate } from "@/lib/utils";
import {
  libelleOccupation,
  occupationsBloquantes,
  occupationsSur,
  plusLonguePeriodeLibre,
  type PeriodeChantier,
} from "@/features/chantiers/fiche/engins-chantier";

/**
 * Conducteurs de la fiche chantier (2026-09-29) — logique pure, même principe
 * que les véhicules (engins-chantier.ts) : chaque conducteur déposé a SA
 * période, comprise dans les dates du chantier. Un chevauchement avec un
 * autre chantier n'est accepté que si les deux rattachements sont
 * « multi-sites » ; une mission bloque toujours. Le serveur
 * (DisponibiliteConducteurChantier) reste l'arbitre.
 */

export interface ConducteurFiche {
  idConducteur: number;
  dateDebut: string;
  dateFin: string;
  /** Vrai tant que la période suit celle du chantier (non retouchée à la main). */
  suitChantier: boolean;
  /** Partagé avec d'autres chantiers. */
  multiSites: boolean;
}

/** « Jean Rakoto (C-012) ». */
export function libelleConducteur(c: Pick<Conducteur, "nom" | "prenom" | "matricule">): string {
  return `${c.prenom} ${c.nom}`.trim() + (c.matricule ? ` (${c.matricule})` : "");
}

export function peutEtreDeposeConducteur(candidat: ConducteurCandidatChantier): boolean {
  return candidat.situation === "DISPONIBLE" || candidat.situation === "SUR_CE_CHANTIER";
}

/** Recherche sur le nom, le prénom, le matricule et le téléphone (sans casse). */
export function filtrerConducteurs(candidats: ConducteurCandidatChantier[], recherche: string): ConducteurCandidatChantier[] {
  const terme = recherche.trim().toLocaleLowerCase("fr");
  if (!terme) return candidats;
  return candidats.filter(({ conducteur }) =>
    [conducteur.nom, conducteur.prenom, conducteur.matricule, conducteur.telephone]
      .filter((v): v is string => Boolean(v))
      .some((v) => v.toLocaleLowerCase("fr").includes(terme)),
  );
}

/**
 * Conducteur déposé : toute la période du chantier s'il y est libre ; sinon
 * sa plus longue période libre ; `null` s'il est pris sur toute la période.
 */
export function conducteurDepose(
  idConducteur: number,
  periode: PeriodeChantier,
  occupations: OccupationChantier[],
  multiSites = false,
): ConducteurFiche | null {
  const libre = plusLonguePeriodeLibre(periode, occupationsBloquantes(occupations, multiSites));
  if (!libre) return null;
  const complete = libre.debut === periode.debut && libre.fin === periode.fin;
  return { idConducteur, dateDebut: libre.debut, dateFin: libre.fin, suitChantier: complete, multiSites };
}

/** Les conducteurs qui suivent le chantier prennent ses nouvelles dates ; les autres gardent les leurs. */
export function synchroniserConducteurs(conducteurs: ConducteurFiche[], periode: PeriodeChantier): ConducteurFiche[] {
  let change = false;
  const resultat = conducteurs.map((c) => {
    if (!c.suitChantier || (c.dateDebut === periode.debut && c.dateFin === periode.fin)) return c;
    change = true;
    return { ...c, dateDebut: periode.debut, dateFin: periode.fin };
  });
  return change ? resultat : conducteurs;
}

/** Problème de la période d'un conducteur (affiché en rouge) ; `null` si elle est valide. */
export function problemePeriodeConducteur(
  conducteur: ConducteurFiche,
  periodeChantier: PeriodeChantier,
  occupations: OccupationChantier[],
): string | null {
  const { dateDebut, dateFin } = conducteur;
  if (!dateDebut || !dateFin) return "Indiquez le début et la fin de la période du conducteur.";
  if (dateFin < dateDebut) return "La fin précède le début.";
  if (dateDebut < periodeChantier.debut || dateFin > periodeChantier.fin) {
    return `Hors des dates du chantier (du ${formatDate(periodeChantier.debut)} au ${formatDate(periodeChantier.fin)}).`;
  }
  const [conflit] = occupationsSur({ debut: dateDebut, fin: dateFin }, occupationsBloquantes(occupations, conducteur.multiSites));
  if (!conflit) return null;
  const conseil =
    conflit.type !== "MISSION" && !conducteur.multiSites ? " Cochez « multi-sites » s'il est partagé entre les deux chantiers." : "";
  return `Déjà ${libelleOccupation(conflit)} du ${formatDate(conflit.dateDebut)} au ${formatDate(conflit.dateFin)}.${conseil}`;
}

/** Corps envoyé avec la fiche. */
export function requeteConducteurs(conducteurs: ConducteurFiche[]): ConducteurFicheRequest[] {
  return conducteurs.map((c) => ({ idConducteur: c.idConducteur, dateDebut: c.dateDebut, dateFin: c.dateFin, multiSites: c.multiSites }));
}
