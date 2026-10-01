import { blocDocuments, blocEquipementsBord, type SourcesRapport } from "@/features/rapport-engin/construire-rapport";
import { fusionnerBlocs } from "@/features/rapport-engin/fusion-blocs";
import type { BlocRapport } from "@/features/rapport-engin/niveaux";

/**
 * Carte « Documents et Inventaire » du rapport véhicule (2026-09-28, demande :
 * « fusionner la carte Documents et Sécurité et boîte à outils, puis renommer
 * en "Documents et Inventaire" »).
 *
 * Réunit (voir fusion-blocs.ts), sans changer leurs règles de couleur :
 *  - les lignes de blocDocuments (une par document, obligatoires absents en rouge) ;
 *  - les deux lignes de synthèse de blocEquipementsBord (« Pharmacie et
 *    sécurité », « Boîte à outils »), clés préfixées « inventaire- ».
 *
 * Clé « documents » : le bouton « Voir détail » ouvre l'onglet Documents de
 * l'historique ; l'onglet « Sécurité et outils » reste dans la même page.
 */
export const TITRE_DOCUMENTS_INVENTAIRE = "Documents et inventaire";

export function blocDocumentsInventaire(sources: SourcesRapport): BlocRapport {
  return fusionnerBlocs("documents", "documents", TITRE_DOCUMENTS_INVENTAIRE, [
    { id: "documents", libelle: "Documents", bloc: blocDocuments(sources) },
    { id: "inventaire", libelle: "Inventaire", bloc: blocEquipementsBord(sources), prefixerCles: true, libelleDansResume: true, videNeutre: true },
  ]);
}
