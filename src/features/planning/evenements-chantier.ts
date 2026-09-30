import type { AffectationChantier } from "@/types/chantier";
import type { EvenementPlanningRessource } from "@/types/planning";

/**
 * Rattachements véhicule ↔ chantier → barres du planning des véhicules
 * (onglet « Planning » d'EnginsPage). Logique pure, testable seule.
 *
 * Depuis le 2026-09-24 (« ce n'est pas la date du chantier qui est en
 * paramètre mais la date de mission d'un véhicule » ; « au moment de la
 * création du chantier le planning des engins est activé »), chaque
 * rattachement porte la période prévue DU VÉHICULE sur le chantier
 * (`dateDebutPrevue` / `dateFinPrevue`, migration V43) : c'est elle qui est
 * affichée, et non plus « date de création du rattachement → fin du
 * chantier ». Le planning se remplit donc dès l'enregistrement de la fiche
 * chantier, même pour un chantier qui ne commence que plus tard.
 *
 * - Rattachement ACTIF : toute sa période prévue.
 * - Rattachement TERMINÉ (véhicule retiré du chantier) : période prévue
 *   écourtée au jour du retrait ; rien si le retrait précède le début.
 * - Rattachement ANNULÉ : non affiché (la réservation n'a jamais eu lieu).
 */
export function evenementsRattachementsChantier(rattachements: AffectationChantier[]): EvenementPlanningRessource[] {
  const evenements: EvenementPlanningRessource[] = [];
  for (const a of rattachements) {
    if (a.statut === "ANNULEE") continue;
    const debut = a.dateDebutPrevue;
    let fin = a.dateFinPrevue;
    if (a.statut === "TERMINEE" && a.dateFin) {
      const jourRetrait = a.dateFin.slice(0, 10);
      if (jourRetrait < fin) fin = jourRetrait;
    }
    if (!debut || !fin || fin < debut) continue;
    evenements.push({
      id: `chantier-${a.idAffectationChantier}`,
      idRessource: a.engin.idEngin,
      type: "CHANTIER",
      libelle: a.chantier.nom,
      // Heure locale explicite : « AAAA-MM-JJ » seul serait lu comme minuit UTC
      // et pourrait glisser d'un jour selon le fuseau (PlanningRessources compare en date locale).
      debut: `${debut}T00:00:00`,
      fin: `${fin}T00:00:00`,
      statut: a.statut,
    });
  }
  return evenements;
}
