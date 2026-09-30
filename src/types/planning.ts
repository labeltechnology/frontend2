/**
 * Événement affiché sur le calendrier d'un conducteur ou d'un engin — combine
 * rattachements de chantier et missions. Ajouté le 2026-09-23, demande
 * explicite de l'utilisateur : « ajoute une calendrier de mission pour le
 * conducteur en fonction des chantiers... et meme chose pour les engins
 * aussi ».
 *
 * `debut`/`fin` sont toujours résolus (jamais `null`) par la page qui
 * construit la liste : un rattachement de chantier utilise la période prévue
 * du véhicule sur le chantier (depuis le 2026-09-24, voir
 * features/planning/evenements-chantier.ts), une mission pas encore
 * terminée utilise ses dates prévues — les composants de calendrier restent
 * des composants de rendu pur, sans logique métier sur ces résolutions.
 */
/** MAINTENANCE (2026-09-25) : maintenances des véhicules, en rouge sur le planning des véhicules. */
export type TypeEvenementPlanning = "CHANTIER" | "MISSION" | "MAINTENANCE";

export interface EvenementPlanning {
  id: string;
  type: TypeEvenementPlanning;
  libelle: string;
  sousLibelle?: string;
  debut: string;
  fin: string;
  statut: string;
  /**
   * Présent uniquement pour un événement de type MISSION (jamais pour un
   * rattachement de chantier, qui n'a pas d'identité propre exploitable
   * ici) : permet au planning interactif (PlanningRessources) de retrouver
   * la mission complète pour la modifier ou la déplacer par glisser-
   * déposer. Ajouté le 2026-09-24, demande explicite de l'utilisateur :
   * « je veux la meme chose que l'exemple » (référence Syncfusion
   * Scheduler — créer/déplacer un événement directement sur le
   * calendrier).
   */
  idMission?: number;
}

/**
 * Variante utilisée par la vue « planning d'équipe » (PlanningRessources) :
 * même événement, mais rattaché à une ressource précise (conducteur ou
 * engin) pour être positionné sur la bonne ligne de la grille — demande
 * explicite de l'utilisateur (référence à l'exemple Bryntum Calendar
 * « shifted ») du 2026-09-23 : « vue globale tous ensemble », remplaçant la
 * vue « un conducteur/engin à la fois » (Select).
 */
export interface EvenementPlanningRessource extends EvenementPlanning {
  idRessource: number;
}
