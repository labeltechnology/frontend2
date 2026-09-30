import { blocAlertes, blocEntretien, type SourcesRapport } from "@/features/rapport-engin/construire-rapport";
import { fusionnerBlocs } from "@/features/rapport-engin/fusion-blocs";
import type { BlocRapport } from "@/features/rapport-engin/niveaux";

/**
 * Carte « Entretien et réparation » du rapport véhicule (2026-09-28, demande :
 * « fusionner aussi la maintenance périodique et l'alerte et maintenance, et
 * renommer en "Entretien et réparation" »).
 *
 * Réunit (voir fusion-blocs.ts), sans changer leurs règles de couleur :
 *  - « Réparation » : les lignes de blocAlertes — véhicule en panne, alertes
 *    non traitées, maintenances planifiées ou en cours ;
 *  - « Entretien » : les lignes de blocEntretien, une par poste d'entretien
 *    périodique (en retard, bientôt, à jour, à renseigner).
 * Clés de ligne déjà distinctes (« panne », « alerte-… », « maintenance-… »,
 * « poste-… ») : pas de préfixe.
 *
 * Clé « alertes » conservée : le bouton « Faire la maintenance » reste sur
 * cette carte, et « Voir détail » ouvre l'onglet « Alertes et maintenance »
 * de l'historique (l'onglet « Entretien » est dans la même page).
 */
export const TITRE_ENTRETIEN_REPARATION = "Entretien et réparation";

export function blocEntretienReparation(sources: SourcesRapport): BlocRapport {
  return fusionnerBlocs("alertes", "entretien", TITRE_ENTRETIEN_REPARATION, [
    { id: "reparation", libelle: "Réparation", bloc: blocAlertes(sources), libelleDansResume: true },
    { id: "entretien", libelle: "Entretien", bloc: blocEntretien(sources), libelleDansResume: true, videNeutre: true },
  ]);
}
