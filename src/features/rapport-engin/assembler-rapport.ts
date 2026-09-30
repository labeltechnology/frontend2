import type { Affectation } from "@/types/affectation";
import type { Carburant, ConsommationMoyenne } from "@/types/carburant";
import type { AffectationChantier } from "@/types/chantier";
import type { Incident } from "@/types/incident";
import type { Mission } from "@/types/mission";
import { blocEmplacement } from "@/features/rapport-engin/bloc-emplacement";
import { blocCarburant } from "@/features/rapport-engin/bloc-carburant";
import { blocConducteur } from "@/features/rapport-engin/bloc-conducteur";
import { blocDocumentsInventaire } from "@/features/rapport-engin/bloc-documents-inventaire";
import { blocEntretienReparation } from "@/features/rapport-engin/bloc-entretien-reparation";
import { blocIncidents } from "@/features/rapport-engin/bloc-incidents";
import type { SourcesRapport } from "@/features/rapport-engin/construire-rapport";
import type { BlocRapport } from "@/features/rapport-engin/niveaux";

/** Toutes les sources du rapport ; `null` = source indisponible (droits, réseau). */
export interface SourcesRapportComplet extends SourcesRapport {
  rattachementsChantier: AffectationChantier[] | null;
  affectations: Affectation[] | null;
  /**
   * Missions (2026-09-25) : la carte « Localisation » affiche en
   * priorité la mission du jour ; la carte « Conducteur » les missions planifiées.
   */
  missions: Mission[] | null;
  /** Carburant (2026-09-25) : pleins de tout le parc et consommation moyenne du véhicule (serveur). */
  pleins: Carburant[] | null;
  consommation: ConsommationMoyenne | null;
  /** Incidents de tout le parc (2026-09-25). */
  incidents: Incident[] | null;
}

/**
 * Six cartes dans l'ordre d'affichage autour de la photo (voir SchemaVehicule) :
 * rangée du haut — entretien et réparation, documents et inventaire (deux
 * fusions du 2026-09-28, voir fusion-blocs.ts), carburant, incidents — puis
 * emplacement du jour (mission, chantier ou siège) à gauche de la photo et
 * conducteur (affecté + missions planifiées) à droite. Plus de rangée du bas.
 */
export function construireRapport(sources: SourcesRapportComplet): BlocRapport[] {
  const { engin, aujourdhui } = sources;
  return [
    blocEntretienReparation(sources),
    blocDocumentsInventaire(sources),
    blocCarburant({ engin, pleins: sources.pleins, consommation: sources.consommation, alertes: sources.alertes, aujourdhui }),
    blocIncidents({ engin, incidents: sources.incidents }),
    blocEmplacement({ engin, rattachements: sources.rattachementsChantier, missions: sources.missions, aujourdhui }),
    blocConducteur({ engin, affectations: sources.affectations, missions: sources.missions, aujourdhui }),
  ];
}
