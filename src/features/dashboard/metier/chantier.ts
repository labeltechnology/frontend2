import { elementsAlertes, joursAvant, trierATraiter, type ElementATraiter } from "@/features/dashboard/indicateurs";
import { formatDate } from "@/lib/utils";
import type { Alerte } from "@/types/alerte";
import type { ChantierCarte } from "@/types/carte-gps";
import type { ChantierResume, DemandeMateriel } from "@/types/chantier";

/**
 * Tableau de bord du chef de chantier (pages par métier, 2026-09-30) : ses
 * chantiers (le serveur ne renvoie que ceux dont il est responsable), les
 * véhicules sur place ou non, ses demandes de matériel. Calculs purs.
 */

/** Fin prévue dans ce délai : le chantier est signalé (prolonger ou clore). */
export const FIN_PROCHE_JOURS = 3;
/** Une demande refusée reste signalée pendant ce délai après la réponse. */
export const REFUS_RECENT_JOURS = 7;

export function cheminChantier(idChantier: number): string {
  return `/chantiers/${idChantier}/fiche`;
}

export interface PresenceVehicules {
  /** Véhicules attendus aujourd'hui sur un chantier en cours. */
  attendus: number;
  surPlace: number;
  horsChantier: number;
  /** Position GPS absente ou trop ancienne. */
  sansPosition: number;
}

/** Présence des véhicules attendus aujourd'hui sur les chantiers en cours (carte GPS). */
export function presenceVehicules(carte: ChantierCarte[]): PresenceVehicules {
  const p: PresenceVehicules = { attendus: 0, surPlace: 0, horsChantier: 0, sansPosition: 0 };
  for (const c of carte) {
    if (c.statut !== "EN_COURS") continue;
    for (const v of c.vehicules) {
      if (!v.prevuAujourdhui) continue;
      p.attendus += 1;
      if (v.surPlace === true) p.surPlace += 1;
      else if (v.surPlace === false) p.horsChantier += 1;
      else p.sansPosition += 1;
    }
  }
  return p;
}

export interface IndicateursChantier {
  enCours: number;
  aVenir: number;
  enRetard: number;
  finProche: number;
  presence: PresenceVehicules;
  demandesEnAttente: number;
  alertes: number;
  alertesCritiques: number;
}

export function indicateursChantier(sources: {
  synthese: ChantierResume[];
  carte: ChantierCarte[];
  demandes: DemandeMateriel[];
  alertes: Alerte[];
}): IndicateursChantier {
  const { synthese, carte, demandes, alertes } = sources;
  const ouvertes = alertes.filter((a) => !a.traitee);
  const actifs = synthese.filter((r) => r.chantier.statut === "EN_COURS");
  return {
    enCours: actifs.length,
    aVenir: synthese.filter((r) => r.chantier.statut === "PLANIFIE").length,
    enRetard: synthese.filter((r) => r.etat === "EN_RETARD").length,
    finProche: actifs.filter((r) => r.joursRestants !== null && r.joursRestants >= 0 && r.joursRestants <= FIN_PROCHE_JOURS).length,
    presence: presenceVehicules(carte),
    demandesEnAttente: demandes.filter((d) => d.statut === "EN_ATTENTE").length,
    alertes: ouvertes.length,
    alertesCritiques: ouvertes.filter((a) => a.priorite === "CRITIQUE").length,
  };
}

/** Chantiers à suivre : en cours et à venir (terminés et annulés écartés), en retard d'abord. */
export function chantiersSuivis(synthese: ChantierResume[]): ChantierResume[] {
  const rang = (r: ChantierResume) => (r.etat === "EN_RETARD" ? 0 : r.chantier.statut === "EN_COURS" ? 1 : 2);
  return synthese
    .filter((r) => r.chantier.statut === "EN_COURS" || r.chantier.statut === "PLANIFIE")
    .sort(
      (a, b) =>
        rang(a) - rang(b) ||
        (a.joursRestants ?? Number.MAX_SAFE_INTEGER) - (b.joursRestants ?? Number.MAX_SAFE_INTEGER) ||
        a.chantier.dateDebutPrevue.localeCompare(b.chantier.dateDebutPrevue),
    );
}

/**
 * Liste de travail du chef de chantier : alertes critiques / élevées de ses
 * chantiers, véhicules attendus mais hors du chantier, chantiers en retard
 * ou qui se terminent, demandes de matériel refusées ces 7 derniers jours.
 */
export function aTraiterChantier(sources: {
  synthese: ChantierResume[];
  carte: ChantierCarte[];
  demandes: DemandeMateriel[];
  alertes: Alerte[];
  maintenant: Date;
}): ElementATraiter[] {
  const { synthese, carte, demandes, alertes, maintenant } = sources;
  const elements = elementsAlertes(alertes);

  for (const c of carte) {
    if (c.statut !== "EN_COURS") continue;
    for (const v of c.vehicules) {
      if (!v.prevuAujourdhui || v.surPlace !== false) continue;
      elements.push({
        cle: `hors-${c.idChantier}-${v.idEngin}`,
        urgence: "elevee",
        categorie: "Véhicule",
        titre: "Véhicule attendu, hors du chantier",
        detail: `${v.libelleVehicule ?? "Véhicule"} — ${c.nom}${v.horodatagePosition ? ` — position du ${formatDate(v.horodatagePosition.slice(0, 10))}` : ""}`,
        lien: "/gps",
        date: v.horodatagePosition ?? "9999-12-31",
      });
    }
  }

  for (const r of synthese) {
    if (r.chantier.statut !== "EN_COURS") continue;
    const fin = `fin prévue le ${formatDate(r.chantier.dateFinPrevue.slice(0, 10))}`;
    if (r.etat === "EN_RETARD" || (r.joursRestants !== null && r.joursRestants < 0)) {
      elements.push({
        cle: `retard-${r.chantier.idChantier}`,
        urgence: "elevee",
        categorie: "Chantier",
        titre: "Chantier en retard",
        detail: `${r.chantier.nom} — ${fin}`,
        lien: cheminChantier(r.chantier.idChantier),
        date: r.chantier.dateFinPrevue,
      });
    } else if (r.joursRestants !== null && r.joursRestants <= FIN_PROCHE_JOURS) {
      elements.push({
        cle: `fin-${r.chantier.idChantier}`,
        urgence: "moyenne",
        categorie: "Chantier",
        titre: r.joursRestants === 0 ? "Chantier qui se termine aujourd'hui" : `Fin du chantier dans ${r.joursRestants} j`,
        detail: `${r.chantier.nom} — ${fin} : prolonger ou clore`,
        lien: cheminChantier(r.chantier.idChantier),
        date: r.chantier.dateFinPrevue,
      });
    }
  }

  for (const d of demandes) {
    if (d.statut !== "REFUSEE") continue;
    if (joursAvant(d.dateReponse ?? d.dateDemande, maintenant) < -REFUS_RECENT_JOURS) continue;
    elements.push({
      cle: `demande-refusee-${d.idDemande}`,
      urgence: "moyenne",
      categorie: "Demande",
      titre: "Demande de matériel refusée",
      detail: `${d.quantite} × ${d.typeEngin} — ${d.nomChantier}${d.reponse ? ` — « ${d.reponse} »` : ""}`,
      lien: cheminChantier(d.idChantier),
      date: d.dateReponse ?? d.dateDemande,
    });
  }

  return trierATraiter(elements);
}
