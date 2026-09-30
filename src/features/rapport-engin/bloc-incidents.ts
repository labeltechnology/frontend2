import { formatDate, formatMontant, libelleEnum } from "@/lib/utils";
import type { PrioriteAlerte } from "@/types/alerte";
import type { Engin } from "@/types/engin";
import type { Incident } from "@/types/incident";
import { incidentsDuVehicule } from "@/features/historique-engin/historique";
import { blocIndisponible, pluriel } from "@/features/rapport-engin/construire-rapport";
import { niveauLePlusGrave, type BlocRapport, type LigneRapport, type NiveauRapport } from "@/features/rapport-engin/niveaux";

/**
 * Carte « Incidents » du rapport véhicule (2026-09-25) : une ligne par
 * incident OUVERT (déclaré ou en traitement), du plus récent au plus ancien.
 *
 * Couleurs : gravité élevée ou critique = rouge ; moyenne ou faible = jaune ;
 * aucun incident ouvert = vert. Résumé : incidents clôturés et coût estimé
 * total de ces incidents.
 */
export interface SourcesIncidents {
  engin: Engin;
  /** Incidents de tout le parc (filtrés ici) ; null = indisponibles. */
  incidents: Incident[] | null;
}

export const NIVEAU_GRAVITE_INCIDENT: Record<PrioriteAlerte, NiveauRapport> = {
  FAIBLE: "avertissement",
  MOYENNE: "avertissement",
  ELEVEE: "alerte",
  CRITIQUE: "alerte",
};

const LONGUEUR_DESCRIPTION = 60;

function abreger(texte: string): string {
  const net = texte.trim().replace(/\s+/g, " ");
  return net.length > LONGUEUR_DESCRIPTION ? `${net.slice(0, LONGUEUR_DESCRIPTION - 1)}…` : net;
}

export function estOuvert(incident: Incident): boolean {
  return incident.statut === "DECLARE" || incident.statut === "EN_TRAITEMENT";
}

export function ligneIncident(incident: Incident): LigneRapport {
  return {
    cle: `incident-${incident.idIncident}`,
    libelle: `${libelleEnum(incident.type)} — gravité ${libelleEnum(incident.gravite).toLowerCase()}`,
    niveau: NIVEAU_GRAVITE_INCIDENT[incident.gravite],
    detail: `${libelleEnum(incident.statut)} depuis le ${formatDate(incident.dateSurvenue.slice(0, 10))} : ${abreger(incident.description)}`,
  };
}

export function blocIncidents({ engin, incidents }: SourcesIncidents): BlocRapport {
  const titre = "Incidents";
  if (incidents === null) return blocIndisponible("incidents", "incidents", titre);

  const duVehicule = incidentsDuVehicule(incidents, engin.idEngin);
  const ouverts = duVehicule.filter(estOuvert);
  const clotures = duVehicule.filter((i) => i.statut === "CLOTURE");
  const cout = clotures.reduce((somme, i) => somme + (i.coutEstime ?? 0), 0);

  const lignes: LigneRapport[] =
    ouverts.length > 0
      ? ouverts.map(ligneIncident)
      : [{ cle: "aucun-incident", libelle: "Aucun incident ouvert", niveau: "ok", detail: "Aucun incident déclaré ou en traitement" }];

  const resume =
    duVehicule.length === 0
      ? "Aucun incident enregistré pour ce véhicule."
      : clotures.length === 0
        ? `${pluriel(ouverts.length, "incident ouvert", "incidents ouverts")}, aucun clôturé`
        : `${pluriel(clotures.length, "incident clôturé", "incidents clôturés")} — coût estimé ${formatMontant(cout)}`;

  return {
    cle: "incidents",
    famille: "incidents",
    titre,
    niveau: niveauLePlusGrave(lignes.map((l) => l.niveau)),
    resume,
    lignes,
  };
}
