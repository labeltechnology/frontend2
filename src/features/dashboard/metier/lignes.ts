import type { TonIndicateur } from "@/features/dashboard/sections/CarteIndicateur";
import { DELAI_RELANCE_JOURS, type EcheanceContrat, type FactureEnAttente } from "@/features/dashboard/metier/finances";
import { cheminChantier } from "@/features/dashboard/metier/chantier";
import type { EtatPlanning, LignePlanning } from "@/features/dashboard/metier/atelier";
import type { LigneLien } from "@/features/dashboard/metier/sections/ListeLiens";
import { formatDate, formatDateTime, formatMontant } from "@/lib/utils";
import type { ChantierCarte } from "@/types/carte-gps";
import type { ChantierResume, DemandeMateriel, EtatSuiviChantier } from "@/types/chantier";
import type { Piece } from "@/types/maintenance";

/**
 * Lignes des listes des tableaux de bord par métier (2026-09-30) : passage
 * des données calculées (atelier.ts, finances.ts, chantier.ts) aux lignes
 * affichées par ListeLiens. Pur, testé seul.
 */

const TON_PLANNING: Record<EtatPlanning, TonIndicateur> = {
  "en-retard": "danger",
  "en-cours": "alerte",
  "a-venir": "info",
  "sans-date": "neutre",
};

export function lignesPlanning(planning: LignePlanning[]): LigneLien[] {
  return planning.map((l) => ({
    cle: `maintenance-${l.maintenance.idMaintenance}`,
    titre: l.vehicule,
    detail: `${l.objet} — ${l.lieu}`,
    etiquette: l.quand,
    ton: TON_PLANNING[l.etat],
    lien: "/maintenance",
  }));
}

export function lignesPieces(pieces: Piece[]): LigneLien[] {
  return pieces.map((p) => ({
    cle: `piece-${p.idPiece}`,
    titre: p.nom,
    detail: `${p.reference} — seuil ${p.seuilAlerteStock}${p.nomFournisseur ? ` — ${p.nomFournisseur}` : ""}`,
    etiquette: p.quantiteStock <= 0 ? "Rupture" : `${p.quantiteStock} en stock`,
    ton: p.quantiteStock <= 0 ? "danger" : "alerte",
    lien: "/maintenance?onglet=pieces",
  }));
}

export function lignesFactures(factures: FactureEnAttente[]): LigneLien[] {
  return factures.map((f) => ({
    cle: f.cle,
    titre: `${formatMontant(f.montant)} — ${f.tiers}`,
    detail: `${f.origine} ${f.reference} — émise le ${formatDate(f.dateEmission.slice(0, 10))}`,
    etiquette: f.sens === "A_PAYER" ? `À régler · ${f.anciennete} j` : `À encaisser · ${f.anciennete} j`,
    ton: f.anciennete > DELAI_RELANCE_JOURS ? "danger" : f.sens === "A_PAYER" ? "alerte" : "info",
    lien: f.lien,
  }));
}

export function lignesEcheances(echeances: EcheanceContrat[]): LigneLien[] {
  return echeances.map((c) => ({
    cle: c.cle,
    titre: `${c.tiers} — ${c.vehicule}`,
    detail: `${c.sens}${c.reference ? ` — ${c.reference}` : ""}${c.tarifJournalier !== null ? ` — ${formatMontant(c.tarifJournalier)} / jour` : ""}`,
    etiquette: c.jours < 0 ? `Dépassé de ${-c.jours} j` : c.jours === 0 ? "Fin aujourd'hui" : `Fin dans ${c.jours} j`,
    ton: c.jours < 0 ? "danger" : c.jours <= 7 ? "alerte" : "info",
    lien: c.lien,
  }));
}

const PRESENTATION_ETAT: Record<EtatSuiviChantier, { libelle: string; ton: TonIndicateur }> = {
  A_VENIR: { libelle: "À venir", ton: "neutre" },
  NON_DEMARRE: { libelle: "Non démarré", ton: "alerte" },
  DANS_LES_TEMPS: { libelle: "Dans les temps", ton: "succes" },
  EN_RETARD: { libelle: "En retard", ton: "danger" },
  TERMINE: { libelle: "Terminé", ton: "neutre" },
  ANNULE: { libelle: "Annulé", ton: "neutre" },
};

export function lignesChantiers(chantiers: ChantierResume[]): LigneLien[] {
  return chantiers.map((r) => {
    const etat = PRESENTATION_ETAT[r.etat] ?? { libelle: r.etat, ton: "neutre" as const };
    const avancement = r.avancement !== null ? ` — ${r.avancement} % du temps écoulé` : "";
    const fin =
      r.joursRestants === null
        ? `du ${formatDate(r.chantier.dateDebutPrevue.slice(0, 10))} au ${formatDate(r.chantier.dateFinPrevue.slice(0, 10))}`
        : r.joursRestants < 0
          ? `fin dépassée de ${-r.joursRestants} j`
          : `fin dans ${r.joursRestants} j`;
    return {
      cle: `chantier-${r.chantier.idChantier}`,
      titre: r.chantier.nom + (r.chantier.lieu ? ` — ${r.chantier.lieu}` : ""),
      detail: `${r.vehicules} véhicule(s), ${r.conducteurs} conducteur(s) — ${fin}${avancement}`,
      etiquette: etat.libelle,
      ton: etat.ton,
      lien: cheminChantier(r.chantier.idChantier),
    };
  });
}

/** Demandes de matériel en attente de réponse (les critiques d'abord, puis les plus anciennes). */
export function lignesDemandesEnAttente(demandes: DemandeMateriel[]): LigneLien[] {
  const rang = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2 } as const;
  return demandes
    .filter((d) => d.statut === "EN_ATTENTE")
    .sort((a, b) => rang[a.priorite] - rang[b.priorite] || a.dateDemande.localeCompare(b.dateDemande))
    .map((d) => ({
      cle: `demande-${d.idDemande}`,
      titre: `${d.quantite} × ${d.typeEngin} — ${d.nomChantier}`,
      detail: `du ${formatDate(d.dateDebut.slice(0, 10))} au ${formatDate(d.dateFin.slice(0, 10))}${d.disponiblesEstimes !== null ? ` — ${d.disponiblesEstimes} disponible(s) estimé(s)` : ""}`,
      etiquette: d.priorite === "CRITIQUE" ? "Critique" : d.priorite === "HAUTE" ? "Haute" : "En attente",
      ton: d.priorite === "CRITIQUE" ? "danger" : d.priorite === "HAUTE" ? "alerte" : "info",
      lien: cheminChantier(d.idChantier),
    }));
}

/** Véhicules attendus aujourd'hui sur les chantiers en cours : hors chantier d'abord, puis sans position, puis sur place. */
export function lignesPresence(carte: ChantierCarte[]): LigneLien[] {
  const lignes: { rang: number; ligne: LigneLien }[] = [];
  for (const c of carte) {
    if (c.statut !== "EN_COURS") continue;
    for (const v of c.vehicules) {
      if (!v.prevuAujourdhui) continue;
      const rang = v.surPlace === false ? 0 : v.surPlace === null ? 1 : 2;
      lignes.push({
        rang,
        ligne: {
          cle: `presence-${c.idChantier}-${v.idEngin}`,
          titre: v.libelleVehicule ?? "Véhicule",
          detail: `${c.nom}${v.horodatagePosition ? ` — position du ${formatDateTime(v.horodatagePosition)}` : " — aucune position reçue"}`,
          etiquette: rang === 0 ? "Hors chantier" : rang === 1 ? "Sans position" : "Sur place",
          ton: rang === 0 ? "danger" : rang === 1 ? "neutre" : "succes",
          lien: "/gps",
        },
      });
    }
  }
  return lignes.sort((a, b) => a.rang - b.rang || a.ligne.titre.localeCompare(b.ligne.titre)).map((l) => l.ligne);
}
