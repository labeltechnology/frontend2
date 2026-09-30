import { LIBELLES_PRIORITE_ALERTE, libelleTypeAlerte } from "@/features/alertes/libelles";
import { formatDateTime } from "@/lib/utils";
import type { Alerte, PrioriteAlerte, TypeAlerte } from "@/types/alerte";

/**
 * Regroupement des alertes répétées (2026-09-28, demande : « si le GPS
 * envoie une alerte toutes les 15 min, il faut qu'on synthétise — ex. GPS
 * désactivé depuis … »). Logique pure, sans React.
 *
 * Deux niveaux complémentaires :
 *  - serveur (V48) : une alerte GPS non traitée cumule ses répétitions
 *    (`nombreOccurrences`, `dateDerniereOccurrence`) ;
 *  - écran (ici) : les lignes restantes de même cible et même type — dont les
 *    anciennes alertes enregistrées avant V48 — sont réunies en un groupe.
 *
 * Utilisé par le rapport véhicule (carte Entretien et réparation), la page
 * Alertes et le panneau « À traiter » du tableau de bord.
 */
export interface GroupeAlertes {
  /** Clé stable du groupe (cible + type + traitée ou non). */
  cle: string;
  type: TypeAlerte;
  /** Alertes du groupe (lignes serveur), de la plus ancienne à la plus récente. */
  alertes: Alerte[];
  /** Occurrences au total (somme des compteurs serveur). */
  nombre: number;
  /** Date-heure ISO de la première occurrence. */
  premiere: string;
  /** Date-heure ISO de la dernière occurrence. */
  derniere: string;
  prioriteMax: PrioriteAlerte;
  /**
   * Escalade par ancienneté (2026-09-28) : plus basse priorité d'origine des
   * alertes escaladées du groupe ; null si aucune n'a été escaladée.
   */
  prioriteInitiale: PrioriteAlerte | null;
  /** Description de l'occurrence la plus récente. */
  description: string;
  traitee: boolean;
  idEngin: number | null;
  /** Véhicule, conducteur ou chantier concerné, à l'écran. */
  libelleCible: string | null;
}

const RANG_PRIORITE: Record<PrioriteAlerte, number> = { FAIBLE: 0, MOYENNE: 1, ELEVEE: 2, CRITIQUE: 3 };

export function occurrences(alerte: Alerte): number {
  return alerte.nombreOccurrences ?? 1;
}

export function derniereOccurrence(alerte: Alerte): string {
  return alerte.dateDerniereOccurrence ?? alerte.dateCreation;
}

/** Même véhicule (ou même chantier, ou même conducteur), même type, même état traité / non traité. */
export function cleParCibleEtType(alerte: Alerte): string {
  const cible =
    alerte.idEngin != null
      ? `engin-${alerte.idEngin}`
      : alerte.idChantier != null
        ? `chantier-${alerte.idChantier}`
        : `conducteur-${alerte.idConducteur ?? "?"}`;
  return `${cible}-${alerte.type}-${alerte.traitee ? "traitee" : "ouverte"}`;
}

/** Groupes, du plus récemment actif au plus ancien. */
export function grouperAlertes(
  alertes: readonly Alerte[],
  cleDe: (alerte: Alerte) => string = cleParCibleEtType,
): GroupeAlertes[] {
  const parCle = new Map<string, Alerte[]>();
  for (const a of alertes) {
    const cle = cleDe(a);
    const liste = parCle.get(cle) ?? [];
    liste.push(a);
    parCle.set(cle, liste);
  }
  const groupes: GroupeAlertes[] = [];
  for (const [cle, liste] of parCle) {
    const triees = [...liste].sort((x, y) => x.dateCreation.localeCompare(y.dateCreation));
    const plusRecente = triees.reduce((r, a) => (derniereOccurrence(a) > derniereOccurrence(r) ? a : r), triees[0]);
    groupes.push({
      cle,
      type: triees[0].type,
      alertes: triees,
      nombre: triees.reduce((n, a) => n + occurrences(a), 0),
      premiere: triees[0].dateCreation,
      derniere: derniereOccurrence(plusRecente),
      prioriteMax: triees.reduce<PrioriteAlerte>(
        (max, a) => (RANG_PRIORITE[a.priorite] > RANG_PRIORITE[max] ? a.priorite : max),
        triees[0].priorite,
      ),
      prioriteInitiale: triees.reduce<PrioriteAlerte | null>(
        (min, a) =>
          a.prioriteInitiale && (min === null || RANG_PRIORITE[a.prioriteInitiale] < RANG_PRIORITE[min]) ? a.prioriteInitiale : min,
        null,
      ),
      description: plusRecente.description,
      traitee: triees.every((a) => a.traitee),
      idEngin: triees[0].idEngin,
      libelleCible:
        triees[0].libelleVehicule ?? triees[0].matriculeConducteur ?? (triees[0].nomChantier ? `Chantier « ${triees[0].nomChantier} »` : null),
    });
  }
  return groupes.sort((x, y) => y.derniere.localeCompare(x.derniere));
}

/** Rang de priorité (0 = faible … 3 = critique), pour trier ou filtrer. */
export function rangPriorite(priorite: PrioriteAlerte): number {
  return RANG_PRIORITE[priorite];
}

/** « GPS désactivé pendant une mission » ; « … (×96) » quand l'alerte s'est répétée. */
export function libelleGroupe(groupe: GroupeAlertes): string {
  const libelle = libelleTypeAlerte(groupe.type);
  return groupe.nombre > 1 ? `${libelle} (×${groupe.nombre})` : libelle;
}

/** « Depuis le 27/09/2026 08:15 » ou « Le 27/09/2026 08:15 » (alerte unique). */
export function periodeGroupe(groupe: GroupeAlertes): string {
  return groupe.nombre > 1
    ? `Depuis le ${formatDateTime(groupe.premiere)} — dernière le ${formatDateTime(groupe.derniere)}`
    : `Le ${formatDateTime(groupe.derniere)}`;
}

/**
 * Une seule alerte : « <description> — le 27/09/2026 08:15 (priorité élevée) ».
 * Répétée : « Depuis le 27/09/2026 08:15, 96 alertes — dernière le
 * 28/09/2026 14:30 : <description> (priorité élevée) ».
 */
export function detailGroupe(groupe: GroupeAlertes): string {
  const priorite = `priorité ${LIBELLES_PRIORITE_ALERTE[groupe.prioriteMax]}`;
  const etat = groupe.traitee ? "traitées" : "non traitées";
  if (groupe.nombre === 1) {
    return `${groupe.description} — le ${formatDateTime(groupe.derniere)} (${priorite})`;
  }
  return (
    `Depuis le ${formatDateTime(groupe.premiere)}, ${groupe.nombre} alertes ${etat} — ` +
    `dernière le ${formatDateTime(groupe.derniere)} : ${groupe.description} (${priorite})`
  );
}
