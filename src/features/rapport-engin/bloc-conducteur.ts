import { formatDate, libelleEnum } from "@/lib/utils";
import type { Affectation } from "@/types/affectation";
import type { Conducteur, StatutConducteur } from "@/types/conducteur";
import type { Engin } from "@/types/engin";
import type { Mission } from "@/types/mission";
import { blocIndisponible, niveauExpiration } from "@/features/rapport-engin/construire-rapport";
import { niveauLePlusGrave, type BlocRapport, type LigneRapport, type NiveauRapport } from "@/features/rapport-engin/niveaux";
import {
  ligneMissionPlanifiee,
  missionsPlanifieesDuVehicule,
  MISSIONS_PLANIFIEES_VISIBLES,
  resumeMissionsPlanifiees,
} from "@/features/rapport-engin/missions-planifiees";

/**
 * Carte « Conducteur » du rapport véhicule (2026-09-24) : le conducteur
 * affecté actuellement au véhicule (affectation ACTIVE) et la validité de son
 * permis — réduite le 2026-09-25 à une ligne par conducteur, colorée par le
 * plus grave des deux.
 *
 * Couleurs :
 *  - Conducteur : en service = vert, en congé = jaune, suspendu ou inactif =
 *    rouge (le véhicule n'a pas de conducteur utilisable).
 *  - Permis (date d'expiration de la fiche conducteur) : expiré = rouge,
 *    expire dans 30 jours ou moins = jaune, valide = vert, date non
 *    renseignée = gris.
 *  - Aucun conducteur affecté = carte grise.
 *
 * Missions planifiées (2026-09-25, demande de l'utilisateur) : sous le
 * conducteur affecté, une ligne par mission PLANIFIEE du véhicule (au plus
 * MISSIONS_PLANIFIEES_VISIBLES, les suivantes sont comptées dans le résumé)
 * — voir missions-planifiees.ts pour les couleurs.
 */
export interface SourcesConducteur {
  engin: Engin;
  /** Affectations conducteur ↔ véhicule (toutes) ; null = indisponibles. */
  affectations: Affectation[] | null;
  /** Missions de tout le parc (filtrées ici) ; null = indisponibles (la carte le signale en note). */
  missions: Mission[] | null;
  /** Date et heure d'établissement du rapport. */
  aujourdhui: Date;
}

const NIVEAU_STATUT_CONDUCTEUR: Record<StatutConducteur, NiveauRapport> = {
  EN_SERVICE: "ok",
  CONGE: "avertissement",
  SUSPENDU: "alerte",
  INACTIF: "alerte",
};

export function lignePermis(conducteur: Conducteur, aujourdhui: Date): LigneRapport {
  const numero = conducteur.numeroPermis ? ` — n° ${conducteur.numeroPermis}` : "";
  const base = { cle: `permis-${conducteur.idConducteur}`, libelle: `Permis ${conducteur.categoriePermis}`.trim() };
  if (!conducteur.dateExpirationPermis) {
    return { ...base, niveau: "inconnu", detail: `Date d'expiration non renseignée${numero}` };
  }
  const { niveau, detail } = niveauExpiration(conducteur.dateExpirationPermis, aujourdhui);
  return { ...base, niveau, detail: `${detail}${numero}` };
}

function premiereLettreMinuscule(texte: string): string {
  return texte.charAt(0).toLowerCase() + texte.slice(1);
}

export function blocConducteur({ engin, affectations, missions, aujourdhui }: SourcesConducteur): BlocRapport {
  const titre = "Conducteur";
  if (affectations === null) return blocIndisponible("conducteur", "conducteur", titre);

  const actives = affectations.filter((a) => a.statut === "ACTIVE" && a.engin.idEngin === engin.idEngin);
  // Carte compacte (2026-09-25) : UNE ligne par conducteur affecté, à la
  // couleur la plus grave entre son statut et son permis ; coordonnées et
  // affectations passées dans la page historique (onglet « Conducteurs »).
  const lignes = actives.map<LigneRapport>((affectation) => {
    const { conducteur } = affectation;
    const permis = lignePermis(conducteur, aujourdhui);
    const niveauStatut = NIVEAU_STATUT_CONDUCTEUR[conducteur.statut];
    return {
      cle: `conducteur-${affectation.idAffectation}`,
      libelle: `${conducteur.prenom} ${conducteur.nom}`,
      niveau: niveauLePlusGrave([niveauStatut, permis.niveau]),
      detail: `${libelleEnum(conducteur.statut)} · ${premiereLettreMinuscule(permis.libelle)} : ${premiereLettreMinuscule(permis.detail)}`,
    };
  });

  const planifiees = missionsPlanifieesDuVehicule(missions ?? [], engin);
  const lignesMissions = planifiees.slice(0, MISSIONS_PLANIFIEES_VISIBLES).map((m) => ligneMissionPlanifiee(m, aujourdhui));

  let resume: string;
  if (actives.length === 0) resume = "Aucun conducteur affecté.";
  else if (actives.length === 1) {
    const { conducteur, dateDebut } = actives[0];
    resume = `Matricule ${conducteur.matricule} — depuis le ${formatDate(dateDebut.slice(0, 10))}`;
  } else resume = `${actives.length} conducteurs affectés`;
  const resumeMissions = resumeMissionsPlanifiees(planifiees.length);
  if (resumeMissions) {
    const cachees = planifiees.length - lignesMissions.length;
    resume += ` · ${resumeMissions}${cachees > 0 ? ` (${cachees} autre${cachees > 1 ? "s" : ""} dans l'historique)` : ""}`;
  }

  // Sans conducteur affecté, la carte reste grise même si des missions sont planifiées.
  const niveauxCarte = [...lignes, ...lignesMissions].map((l) => l.niveau);
  return {
    cle: "conducteur",
    famille: "conducteur",
    titre,
    niveau: actives.length === 0 ? niveauLePlusGrave(["inconnu", ...niveauxCarte]) : niveauLePlusGrave(niveauxCarte),
    resume,
    lignes: [...lignes, ...lignesMissions],
    note: missions === null ? "Missions indisponibles pour votre profil." : undefined,
  };
}
