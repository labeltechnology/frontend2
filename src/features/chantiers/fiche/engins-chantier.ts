import type { Engin } from "@/types/engin";
import type { BesoinFicheRequest, EnginCandidatChantier, OccupationChantier } from "@/types/chantier";
import { formatDate } from "@/lib/utils";
import { comparerVehicules } from "@/lib/vehicule";

/**
 * Fiche chantier — logique pure, sans React : regroupement des véhicules par
 * type, filtre du parc et besoins déduits de la liste des véhicules.
 *
 * Depuis le 2026-09-24 (demande de l'utilisateur : « on va changer les
 * besoins de chantier par liste des véhicules »), les besoins en matériel ne
 * se saisissent plus : ils SONT la liste des véhicules à employer. Le nombre
 * de véhicules déposés par type est envoyé comme besoin, ce qui garde à jour
 * la table besoin_materiel_chantier utilisée par les autres écrans
 * (disponibilité prévisionnelle, planning).
 */

/** Besoins = nombre de véhicules par type, dans l'ordre de première apparition. */
export function besoinsDepuisEngins(engins: Engin[]): BesoinFicheRequest[] {
  const parType = new Map<number, number>();
  for (const engin of engins) {
    const id = engin.typeEngin.idTypeEngin;
    parType.set(id, (parType.get(id) ?? 0) + 1);
  }
  return [...parType].map(([idTypeEngin, quantite]) => ({ idTypeEngin, quantite }));
}

/** Engins regroupés par type (libellé alphabétique), codes triés — colonne « Véhicules du chantier ». */
export function grouperParType(engins: Engin[]): { idTypeEngin: number; libelle: string; engins: Engin[] }[] {
  const groupes = new Map<number, { idTypeEngin: number; libelle: string; engins: Engin[] }>();
  for (const engin of engins) {
    const { idTypeEngin, libelle } = engin.typeEngin;
    if (!groupes.has(idTypeEngin)) groupes.set(idTypeEngin, { idTypeEngin, libelle, engins: [] });
    groupes.get(idTypeEngin)!.engins.push(engin);
  }
  const liste = [...groupes.values()];
  liste.forEach((g) => g.engins.sort(comparerVehicules));
  return liste.sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
}

/**
 * Un engin peut être déposé sur le chantier s'il est libre, ou s'il y était
 * déjà rattaché (retiré puis remis pendant la saisie). Même règle que le
 * backend (AffectationChantierService) — le backend reste l'arbitre final.
 * V64 (2026-09-29) : un véhicule réservé aux chantiers critiques ne se dépose
 * que sur un chantier critique (sauf s'il y est déjà).
 */
export function peutEtreDepose(candidat: EnginCandidatChantier, chantierCritique = true): boolean {
  if (candidat.situation === "SUR_CE_CHANTIER") return true;
  return candidat.situation === "DISPONIBLE" && (!candidat.reserveCritique || chantierCritique);
}

/** Candidats filtrés par texte (immatriculation, n° de série, n° de châssis, marque, modèle) et par type. */
export function filtrerCandidats(
  candidats: EnginCandidatChantier[],
  recherche: string,
  idTypeEngin: number | null,
): EnginCandidatChantier[] {
  const terme = recherche.trim().toLocaleLowerCase("fr");
  return candidats.filter(({ engin }) => {
    if (idTypeEngin !== null && engin.typeEngin.idTypeEngin !== idTypeEngin) return false;
    if (!terme) return true;
    return [engin.immatriculation, engin.numeroSerie, engin.numeroChassis, engin.marque, engin.modele]
      .filter((v): v is string => Boolean(v))
      .some((v) => v.toLocaleLowerCase("fr").includes(terme));
  });
}

// --- Période de chaque véhicule sur le chantier (2026-09-24) -----------------
// « Ce n'est pas la date du chantier qui est en paramètre mais la date de
// mission d'un véhicule » : chaque véhicule déposé a sa période, comprise dans
// les dates du chantier ; les conflits se jugent sur cette période. Mêmes
// règles que DisponibiliteEnginChantier côté backend (qui reste l'arbitre).
// Dates au format ISO AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique.

/** Période saisie (AAAA-MM-JJ), bornes incluses. */
export interface PeriodeChantier {
  debut: string;
  fin: string;
}

/** Un véhicule déposé sur la fiche et sa période sur le chantier. */
export interface VehiculeFiche {
  idEngin: number;
  dateDebut: string;
  dateFin: string;
  /** Vrai tant que la période suit celle du chantier (non retouchée à la main). */
  suitChantier: boolean;
}

/**
 * « sur « Route RN7 » » ou « en mission « Livraison » » (2026-09-29 : les
 * missions actives font partie des occupations).
 */
export function libelleOccupation(o: OccupationChantier): string {
  return o.type === "MISSION" ? `en mission « ${o.nomChantier} »` : `sur « ${o.nomChantier} »`;
}

/**
 * Occupations qui empêchent une période : toutes, sauf — pour un conducteur
 * « multi-sites » — les autres chantiers où il est aussi multi-sites.
 * Une mission bloque toujours. Même règle que DisponibiliteConducteurChantier.
 */
export function occupationsBloquantes(occupations: OccupationChantier[], multiSites = false): OccupationChantier[] {
  return multiSites ? occupations.filter((o) => o.type === "MISSION" || !o.multiSites) : occupations;
}

/** Chevauchement de deux périodes, bornes incluses (même règle que le backend). */
export function seChevauchent(a: PeriodeChantier, b: PeriodeChantier): boolean {
  return a.debut <= b.fin && b.debut <= a.fin;
}

function decalerJour(dateIso: string, jours: number): string {
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour + jours));
  return date.toISOString().slice(0, 10);
}

/** Occupations du véhicule sur d'autres chantiers qui chevauchent la période. */
export function occupationsSur(periode: PeriodeChantier, occupations: OccupationChantier[]): OccupationChantier[] {
  return occupations.filter((o) => seChevauchent(periode, { debut: o.dateDebut, fin: o.dateFin }));
}

/**
 * Plus longue sous-période libre de `periode` (hors occupations), la plus tôt
 * à longueur égale ; `null` si le véhicule est pris sur toute la période.
 */
export function plusLonguePeriodeLibre(
  periode: PeriodeChantier,
  occupations: OccupationChantier[],
): PeriodeChantier | null {
  const prises = occupationsSur(periode, occupations).sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
  let meilleure: PeriodeChantier | null = null;
  let curseur = periode.debut;
  const retenir = (debut: string, fin: string) => {
    if (debut > fin) return;
    const duree = (x: PeriodeChantier) => Date.parse(x.fin) - Date.parse(x.debut);
    const candidate = { debut, fin };
    if (!meilleure || duree(candidate) > duree(meilleure)) meilleure = candidate;
  };
  for (const o of prises) {
    if (o.dateDebut > curseur) retenir(curseur, decalerJour(o.dateDebut, -1));
    if (o.dateFin >= curseur) curseur = decalerJour(o.dateFin, 1);
  }
  retenir(curseur, periode.fin);
  return meilleure;
}

/**
 * Véhicule déposé : toute la période du chantier s'il y est libre ; sinon sa
 * plus longue période libre (à ajuster si besoin) ; `null` s'il est pris sur
 * toute la période.
 */
export function vehiculeDepose(
  idEngin: number,
  periode: PeriodeChantier,
  occupations: OccupationChantier[],
): VehiculeFiche | null {
  const libre = plusLonguePeriodeLibre(periode, occupations);
  if (!libre) return null;
  const complete = libre.debut === periode.debut && libre.fin === periode.fin;
  return { idEngin, dateDebut: libre.debut, dateFin: libre.fin, suitChantier: complete };
}

/** Les véhicules qui suivent le chantier prennent ses nouvelles dates ; les autres gardent les leurs. */
export function synchroniserAvecChantier(vehicules: VehiculeFiche[], periode: PeriodeChantier): VehiculeFiche[] {
  let change = false;
  const resultat = vehicules.map((v) => {
    if (!v.suitChantier || (v.dateDebut === periode.debut && v.dateFin === periode.fin)) return v;
    change = true;
    return { ...v, dateDebut: periode.debut, dateFin: periode.fin };
  });
  return change ? resultat : vehicules;
}

/** Problème de la période d'un véhicule (message affiché sous sa carte) ; `null` si elle est valide. */
export function problemePeriode(
  vehicule: VehiculeFiche,
  periodeChantier: PeriodeChantier,
  occupations: OccupationChantier[],
): string | null {
  const { dateDebut, dateFin } = vehicule;
  if (!dateDebut || !dateFin) return "Indiquez le début et la fin de la période du véhicule.";
  if (dateFin < dateDebut) return "La fin précède le début.";
  if (dateDebut < periodeChantier.debut || dateFin > periodeChantier.fin) {
    return `Hors des dates du chantier (du ${formatDate(periodeChantier.debut)} au ${formatDate(periodeChantier.fin)}).`;
  }
  const [conflit] = occupationsSur({ debut: dateDebut, fin: dateFin }, occupations);
  return conflit
    ? `Déjà ${libelleOccupation(conflit)} du ${formatDate(conflit.dateDebut)} au ${formatDate(conflit.dateFin)}.`
    : null;
}
