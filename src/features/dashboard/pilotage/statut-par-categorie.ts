import { LIBELLES_CATEGORIE, lienVehiculesFiltres } from "@/features/engins/filtre-url";
import { GROUPES_STATUT, type SanteParc, type SanteVehicule } from "@/features/dashboard/sante-parc";
import { normaliserFamille, SANS_FAMILLE } from "@/features/engins/familles-type";
import type { CategorieEngin, StatutEngin } from "@/types/engin";

/**
 * « Statut du parc » du tableau de bord de direction (2026-09-30, choix
 * validés : deux niveaux — catégorie puis type de matériel — et synthèse
 * chiffrée à la place des tuiles). Reprend la santé calculée par
 * sante-parc.ts : un véhicule « en alerte » ici l'est aussi sur le mur du
 * parc et dans son rapport. Logique pure, testée.
 *
 * 2026-10-01 : troisième niveau, la famille du type (« Véhicule de service »
 * → 4x4, léger, bus), entre la catégorie et le type.
 */
export interface CompteursStatut {
  total: number;
  utilisables: number;
  immobilises: number;
  enAlerte: number;
  aSurveiller: number;
  /** Nombre par statut, dans l'ordre de GROUPES_STATUT (pour la barre). */
  parStatut: Record<StatutEngin, number>;
}

export interface LigneType {
  idTypeEngin: number | null;
  libelle: string;
  compteurs: CompteursStatut;
  lien: string | null;
}

/** Famille de types (null = types sans famille, libellé « Autres »). */
export interface LigneFamille {
  famille: string | null;
  libelle: string;
  compteurs: CompteursStatut;
  types: LigneType[];
}

export interface LigneCategorie {
  categorie: CategorieEngin;
  libelle: string;
  compteurs: CompteursStatut;
  /** Tous les types de la catégorie (sans regroupement). */
  types: LigneType[];
  /** Types regroupés par famille ; une seule entrée « sans famille » si aucune famille n'est renseignée. */
  familles: LigneFamille[];
  /** Vrai si au moins un type de la catégorie a une famille : l'écran affiche alors le niveau famille. */
  avecFamilles: boolean;
  lien: string;
}

const ORDRE_CATEGORIES: CategorieEngin[] = ["VEHICULE_ROUTIER", "ENGIN_CHANTIER"];
const UTILISABLES = new Set(GROUPES_STATUT.filter((g) => g.utilisable).map((g) => g.statut));

function compter(santes: SanteVehicule[]): CompteursStatut {
  const parStatut = Object.fromEntries(GROUPES_STATUT.map((g) => [g.statut, 0])) as Record<StatutEngin, number>;
  let utilisables = 0;
  for (const s of santes) {
    parStatut[s.engin.statut] = (parStatut[s.engin.statut] ?? 0) + 1;
    if (UTILISABLES.has(s.engin.statut)) utilisables++;
  }
  return {
    total: santes.length,
    utilisables,
    immobilises: santes.length - utilisables,
    enAlerte: santes.filter((s) => s.niveau === "alerte").length,
    aSurveiller: santes.filter((s) => s.niveau === "avertissement").length,
    parStatut,
  };
}

/** Types : les plus nombreux d'abord, puis par libellé ; « Sans type » en dernier. */
function comparerTypes(a: LigneType, b: LigneType): number {
  if ((a.idTypeEngin === null) !== (b.idTypeEngin === null)) return a.idTypeEngin === null ? 1 : -1;
  return b.compteurs.total - a.compteurs.total || a.libelle.localeCompare(b.libelle, "fr");
}

/** Familles : les plus nombreuses d'abord, puis par libellé ; « Autres » en dernier. */
function comparerFamilles(a: LigneFamille, b: LigneFamille): number {
  if ((a.famille === null) !== (b.famille === null)) return a.famille === null ? 1 : -1;
  return b.compteurs.total - a.compteurs.total || a.libelle.localeCompare(b.libelle, "fr");
}

export function statutParCategorie(sante: SanteParc): LigneCategorie[] {
  const santes = sante.groupes.flatMap((g) => g.vehicules);
  return ORDRE_CATEGORIES.map((categorie) => {
    const dansCategorie = santes.filter((s) => (s.engin.typeEngin?.categorie ?? "VEHICULE_ROUTIER") === categorie);
    const parType = new Map<number | null, SanteVehicule[]>();
    for (const s of dansCategorie) {
      const id = s.engin.typeEngin?.idTypeEngin ?? null;
      parType.set(id, [...(parType.get(id) ?? []), s]);
    }
    const lignesTypes: { famille: string | null; ligne: LigneType; santes: SanteVehicule[] }[] = [...parType.entries()].map(
      ([id, liste]) => ({
        famille: id === null ? null : normaliserFamille(liste[0].engin.typeEngin.famille),
        santes: liste,
        ligne: {
          idTypeEngin: id,
          libelle: id === null ? "Sans type" : liste[0].engin.typeEngin.libelle,
          compteurs: compter(liste),
          lien: id === null ? null : lienVehiculesFiltres({ idTypeEngin: id }),
        },
      }),
    );
    const parFamille = new Map<string, { famille: string | null; lignes: typeof lignesTypes }>();
    for (const l of lignesTypes) {
      const cle = l.famille?.toLocaleLowerCase("fr") ?? "";
      const groupe = parFamille.get(cle) ?? { famille: l.famille, lignes: [] };
      groupe.lignes.push(l);
      parFamille.set(cle, groupe);
    }
    const familles: LigneFamille[] = [...parFamille.values()]
      .map((g) => ({
        famille: g.famille,
        libelle: g.famille ?? SANS_FAMILLE,
        compteurs: compter(g.lignes.flatMap((l) => l.santes)),
        types: g.lignes.map((l) => l.ligne).sort(comparerTypes),
      }))
      .sort(comparerFamilles);
    return {
      categorie,
      libelle: LIBELLES_CATEGORIE[categorie],
      compteurs: compter(dansCategorie),
      types: lignesTypes.map((l) => l.ligne).sort(comparerTypes),
      familles,
      avecFamilles: familles.some((f) => f.famille !== null),
      lien: lienVehiculesFiltres({ categorie }),
    };
  }).filter((c) => c.compteurs.total > 0);
}

/** Largeur de chaque segment de la barre, en % du total (segments vides omis). */
export function segmentsStatut(c: CompteursStatut): { statut: StatutEngin; libelle: string; nombre: number; largeur: number }[] {
  return GROUPES_STATUT.filter((g) => c.parStatut[g.statut] > 0).map((g) => ({
    statut: g.statut,
    libelle: g.libelle,
    nombre: c.parStatut[g.statut],
    largeur: c.total > 0 ? (c.parStatut[g.statut] / c.total) * 100 : 0,
  }));
}
