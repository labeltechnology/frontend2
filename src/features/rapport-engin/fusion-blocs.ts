import { blocIndisponible } from "@/features/rapport-engin/construire-rapport";
import {
  niveauLePlusGrave,
  type BlocRapport,
  type FamilleBloc,
  type LigneRapport,
  type NiveauRapport,
} from "@/features/rapport-engin/niveaux";

/**
 * Fusion de plusieurs cartes du rapport en une seule (2026-09-28 : « Documents
 * et Inventaire », « Entretien et réparation »). Les blocs d'origine gardent
 * leurs règles de couleur et restent utilisables seuls (mur du parc,
 * historique) : la fusion ne fait que réunir lignes, résumés et notes.
 *
 * - Toutes les parties indisponibles : la carte entière est indisponible.
 * - Une partie indisponible : une ligne grise « Données indisponibles » la remplace.
 * - Lignes dans l'ordre des parties ; la carte affiche d'abord les plus graves
 *   (CarteBlocRapport).
 * - Couleur : la plus grave des parties (niveau propre de chaque bloc) ; une
 *   partie `videNeutre` sans aucune ligne (« aucun poste ne s'applique ») ne
 *   colore pas la carte — sinon un véhicule sain passerait au gris.
 * - Résumé : résumés des parties séparés par « — », chacun précédé de son
 *   libellé quand `libelleDansResume` est vrai (« Inventaire : … »).
 */
export interface PartieFusion {
  /** Identifiant court de la partie : préfixe des clés de ligne (si `prefixerCles`) et clé de la ligne « indisponible ». */
  id: string;
  /** Libellé de la partie (ligne « indisponible », résumé). */
  libelle: string;
  bloc: BlocRapport;
  /** Préfixer les clés de ligne par `id` (à activer si elles risquent de coïncider avec celles d'une autre partie). */
  prefixerCles?: boolean;
  /** Faire précéder le résumé de la partie par « Libellé : ». */
  libelleDansResume?: boolean;
  /** Sans ligne, la partie n'influe pas sur la couleur de la carte (rien ne s'applique au véhicule). */
  videNeutre?: boolean;
}

export const DETAIL_INDISPONIBLE = "Données indisponibles (accès refusé ou erreur de chargement)";

export function fusionnerBlocs(cle: string, famille: FamilleBloc, titre: string, parties: PartieFusion[]): BlocRapport {
  if (parties.every((p) => p.bloc.indisponible)) return blocIndisponible(cle, famille, titre);

  const lignes: LigneRapport[] = parties.flatMap((p) =>
    p.bloc.indisponible
      ? [{ cle: `${p.id}-indisponible`, libelle: p.libelle, niveau: "inconnu" as const, detail: DETAIL_INDISPONIBLE }]
      : p.bloc.lignes.map((l) => (p.prefixerCles ? { ...l, cle: `${p.id}-${l.cle}` } : l)),
  );

  const resume = parties
    .map((p) => {
      if (p.bloc.indisponible) return `${p.libelle} : indisponible`;
      return p.libelleDansResume ? `${p.libelle} : ${minusculeInitiale(sansPointFinal(p.bloc.resume))}` : sansPointFinal(p.bloc.resume);
    })
    .join(" — ");

  const notes = parties.map((p) => p.bloc.note).filter((n): n is string => Boolean(n));
  return {
    cle,
    famille,
    titre,
    niveau: niveauLePlusGrave(
      parties.flatMap((p): NiveauRapport[] => {
        if (p.bloc.indisponible) return ["inconnu"];
        if (p.bloc.lignes.length === 0 && p.videNeutre) return [];
        return [p.bloc.niveau];
      }),
      "ok",
    ),
    resume,
    lignes,
    note: notes.length > 0 ? notes.join(" ") : undefined,
  };
}

function minusculeInitiale(texte: string): string {
  return texte ? texte.charAt(0).toLowerCase() + texte.slice(1) : texte;
}

function sansPointFinal(texte: string): string {
  return texte.endsWith(".") ? texte.slice(0, -1) : texte;
}
