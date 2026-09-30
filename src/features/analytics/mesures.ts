import { formatMontant, formatNombre } from "@/lib/utils";
import { lireDate } from "@/features/analytics/periode";
import type { Carburant } from "@/types/carburant";
import type { Engin } from "@/types/engin";
import type { Incident } from "@/types/incident";
import type { Maintenance } from "@/types/maintenance";
import type { Mission } from "@/types/mission";

/**
 * Mesures de la page Analytique (2026-09-25). Chaque mesure transforme les
 * données en « faits » datés et rattachés à un véhicule ; les agrégats
 * (totaux, séries, classements) se calculent ensuite de la même façon pour
 * toutes. Logique pure, testable seule.
 *
 * Sources et dates retenues :
 *  - carburant : chaque plein, à sa date, montant ou litres ;
 *  - maintenance : maintenances terminées, à leur date de fin, coût total
 *    figé à la clôture (à défaut, coût calculé) ;
 *  - km parcourus : missions terminées, à leur date de retour réelle,
 *    kilométrage retour − départ ;
 *  - missions : missions non annulées, à leur date de départ (réelle, sinon prévue) ;
 *  - incidents : à leur date de survenue.
 */
export type CleMesure = "coutTotal" | "carburant" | "litres" | "maintenance" | "km" | "missions" | "incidents";

export interface Fait {
  date: Date;
  valeur: number;
  idEngin: number;
}

export interface SourcesAnalyse {
  pleins: Carburant[];
  maintenances: Maintenance[];
  missions: Mission[];
  incidents: Incident[];
}

export interface DefinitionMesure {
  cle: CleMesure;
  libelle: string;
  /** Sens souhaitable : une hausse de coût est mauvaise, une hausse de km est neutre. */
  hausseSouhaitable: boolean | null;
  formater: (valeur: number) => string;
  faits: (sources: SourcesAnalyse) => Fait[];
}

function faitsCarburant(pleins: Carburant[], champ: "montantTotal" | "quantiteLitres"): Fait[] {
  return pleins.flatMap((p) => {
    const date = lireDate(p.dateHeure);
    return date ? [{ date, valeur: p[champ], idEngin: p.engin.idEngin }] : [];
  });
}

function faitsMaintenance(maintenances: Maintenance[]): Fait[] {
  return maintenances.flatMap((m) => {
    const date = lireDate(m.dateFin);
    const cout = m.coutTotal ?? m.coutCalcule ?? 0;
    return m.statut === "TERMINEE" && date && m.engin ? [{ date, valeur: cout, idEngin: m.engin.idEngin }] : [];
  });
}

export function kilometresMission(m: Mission): number {
  if (m.kilometrageDepart == null || m.kilometrageRetour == null) return 0;
  return Math.max(0, m.kilometrageRetour - m.kilometrageDepart);
}

export const MESURES: DefinitionMesure[] = [
  {
    cle: "coutTotal",
    libelle: "Coût total (carburant + maintenance)",
    hausseSouhaitable: false,
    formater: formatMontant,
    faits: (s) => [...faitsCarburant(s.pleins, "montantTotal"), ...faitsMaintenance(s.maintenances)],
  },
  {
    cle: "carburant",
    libelle: "Dépense carburant",
    hausseSouhaitable: false,
    formater: formatMontant,
    faits: (s) => faitsCarburant(s.pleins, "montantTotal"),
  },
  {
    cle: "litres",
    libelle: "Litres de carburant",
    hausseSouhaitable: false,
    formater: (v) => `${formatNombre(v)} L`,
    faits: (s) => faitsCarburant(s.pleins, "quantiteLitres"),
  },
  {
    cle: "maintenance",
    libelle: "Coût de maintenance",
    hausseSouhaitable: false,
    formater: formatMontant,
    faits: (s) => faitsMaintenance(s.maintenances),
  },
  {
    cle: "km",
    libelle: "Kilomètres parcourus (missions)",
    hausseSouhaitable: null,
    formater: (v) => `${formatNombre(v)} km`,
    faits: (s) =>
      s.missions.flatMap((m) => {
        const date = lireDate(m.dateFinReelle);
        return m.statut === "TERMINEE" && date ? [{ date, valeur: kilometresMission(m), idEngin: m.engin.idEngin }] : [];
      }),
  },
  {
    cle: "missions",
    libelle: "Nombre de missions",
    hausseSouhaitable: null,
    formater: (v) => formatNombre(v),
    faits: (s) =>
      s.missions.flatMap((m) => {
        const date = lireDate(m.dateDebutReelle ?? m.dateDebutPrevue);
        return m.statut !== "ANNULEE" && date ? [{ date, valeur: 1, idEngin: m.engin.idEngin }] : [];
      }),
  },
  {
    cle: "incidents",
    libelle: "Nombre d'incidents",
    hausseSouhaitable: false,
    formater: (v) => formatNombre(v),
    faits: (s) =>
      s.incidents.flatMap((i) => {
        const date = lireDate(i.dateSurvenue);
        return date ? [{ date, valeur: 1, idEngin: i.engin.idEngin }] : [];
      }),
  },
];

export function mesure(cle: CleMesure): DefinitionMesure {
  return MESURES.find((m) => m.cle === cle) ?? MESURES[0];
}

/** Filtres « véhicule » et « type de véhicule » de la page. */
export interface FiltreVehicules {
  idEngin: number | null;
  idTypeEngin: number | null;
}

/** Ensemble des véhicules retenus par les filtres (null = pas de filtre, tous). */
export function vehiculesRetenus(engins: Engin[], filtre: FiltreVehicules): Set<number> | null {
  if (filtre.idEngin === null && filtre.idTypeEngin === null) return null;
  return new Set(
    engins
      .filter((e) => (filtre.idEngin === null || e.idEngin === filtre.idEngin) && (filtre.idTypeEngin === null || e.typeEngin?.idTypeEngin === filtre.idTypeEngin))
      .map((e) => e.idEngin),
  );
}

export function filtrerFaits(faits: Fait[], retenus: Set<number> | null): Fait[] {
  return retenus === null ? faits : faits.filter((f) => retenus.has(f.idEngin));
}
