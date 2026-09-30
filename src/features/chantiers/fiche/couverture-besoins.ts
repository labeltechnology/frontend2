import type { Engin } from "@/types/engin";
import type { BesoinFicheRequest, EnginCandidatChantier } from "@/types/chantier";
import { comparerVehicules } from "@/lib/vehicule";

/**
 * Fiche chantier (2026-09-24) — logique pure, sans React : couverture des
 * besoins en matériel par les engins déposés (jauge « 2 / 3 pelles »),
 * regroupement par type et conversion des lignes saisies. Testable seule.
 */

/** Ligne « Besoins en matériel » telle que saisie (chaînes des champs de formulaire). */
export interface LigneBesoin {
  /** Clé stable pour React (pas l'id du type : il peut changer à la saisie). */
  cle: string;
  idTypeEngin: string;
  quantite: string;
}

/**
 * - `vide` : besoin exprimé, aucun engin déposé ;
 * - `partiel` / `complet` / `depasse` : moins / autant / plus que demandé ;
 * - `hors-besoin` : engins déposés d'un type pour lequel aucun besoin n'est exprimé.
 */
export type EtatCouverture = "vide" | "partiel" | "complet" | "depasse" | "hors-besoin";

export interface CouvertureType {
  idTypeEngin: number;
  libelle: string;
  requis: number;
  affectes: number;
  etat: EtatCouverture;
}

let compteurLignes = 0;
/** Nouvelle ligne de besoin (clé locale unique, sans crypto.randomUUID qui échoue en HTTP simple). */
export function nouvelleLigneBesoin(idTypeEngin = "", quantite = "1"): LigneBesoin {
  compteurLignes += 1;
  return { cle: `besoin-${compteurLignes}`, idTypeEngin, quantite };
}

/** Quantité saisie valide (entier de 1 à 999, comme la validation backend) ; `null` sinon. */
export function quantiteValide(saisie: string): number | null {
  const n = Number(saisie.trim());
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : null;
}

/** Lignes complètes seulement (type choisi, quantité valide), un seul besoin par type (le premier gagne). */
export function besoinsDepuisLignes(lignes: LigneBesoin[]): BesoinFicheRequest[] {
  const vus = new Set<number>();
  const besoins: BesoinFicheRequest[] = [];
  for (const ligne of lignes) {
    const idTypeEngin = Number(ligne.idTypeEngin);
    const quantite = quantiteValide(ligne.quantite);
    if (!ligne.idTypeEngin || !Number.isInteger(idTypeEngin) || quantite === null || vus.has(idTypeEngin)) continue;
    vus.add(idTypeEngin);
    besoins.push({ idTypeEngin, quantite });
  }
  return besoins;
}

function etat(requis: number, affectes: number): EtatCouverture {
  if (requis === 0) return "hors-besoin";
  if (affectes === 0) return "vide";
  if (affectes < requis) return "partiel";
  return affectes === requis ? "complet" : "depasse";
}

/**
 * Couverture par type : d'abord les types demandés (ordre des besoins), puis
 * les types déposés sans besoin exprimé. `libelles` sert aux types demandés
 * pour lesquels aucun engin n'est encore déposé.
 */
export function couvertureBesoins(
  besoins: BesoinFicheRequest[],
  enginsDeposes: Engin[],
  libelles: ReadonlyMap<number, string>,
): CouvertureType[] {
  const affectesParType = new Map<number, number>();
  const libelleDepose = new Map<number, string>();
  for (const engin of enginsDeposes) {
    const id = engin.typeEngin.idTypeEngin;
    affectesParType.set(id, (affectesParType.get(id) ?? 0) + 1);
    libelleDepose.set(id, engin.typeEngin.libelle);
  }

  const resultat: CouvertureType[] = besoins.map((b) => {
    const affectes = affectesParType.get(b.idTypeEngin) ?? 0;
    return {
      idTypeEngin: b.idTypeEngin,
      libelle: libelles.get(b.idTypeEngin) ?? libelleDepose.get(b.idTypeEngin) ?? `Type n° ${b.idTypeEngin}`,
      requis: b.quantite,
      affectes,
      etat: etat(b.quantite, affectes),
    };
  });
  const demandes = new Set(besoins.map((b) => b.idTypeEngin));
  for (const [idTypeEngin, affectes] of affectesParType) {
    if (demandes.has(idTypeEngin)) continue;
    resultat.push({ idTypeEngin, libelle: libelleDepose.get(idTypeEngin)!, requis: 0, affectes, etat: "hors-besoin" });
  }
  return resultat;
}

/** Engins regroupés par type (libellé alphabétique), codes triés — colonne « Engins du chantier ». */
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
 */
export function peutEtreDepose(candidat: EnginCandidatChantier): boolean {
  return candidat.situation === "DISPONIBLE" || candidat.situation === "SUR_CE_CHANTIER";
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
